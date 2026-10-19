import { useCallback, useEffect, useRef } from "react";
import { deviceStore, type StoredAttempt } from "./deviceStore";
import { useDeviceState } from "./useDeviceState";
import { useNetwork } from "./useNetwork";
import { computeAttemptChecksum } from "./attemptChecksum";
import {
  postSyncAttempt,
  SyncRejectedError,
} from "../endpoints/attempts/sync_POST.schema";

// Waiting to send: not confirmed, not refused, and has a class code.
const isQueued = (a: StoredAttempt) =>
  a.status !== "synced" && !a.rejected && !!a.joinCode;

// Sends queued attempts when online. Each one carries an integrity checksum.
// An attempt only becomes "synced" after the server confirms it, and the score
// shown afterwards is the one the server recorded. A failed send goes back to
// "saved" and is retried. A refusal that retrying cannot fix is flagged instead.
export const useSyncEngine = () => {
  const { attempts } = useDeviceState();
  const { online } = useNetwork();
  const running = useRef(false);
  const pendingCount = attempts.filter(isQueued).length;

  const flush = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const queue = deviceStore.getSnapshot().attempts.filter(isQueued).reverse();
      for (const a of queue) {
        deviceStore.updateAttempt(a.attemptId, { status: "syncing" });
        try {
          const fields = {
            attemptId: a.attemptId,
            studentCode: a.studentCode,
            studentName: a.studentName,
            joinCode: a.joinCode,
            unitId: a.unitId,
            quizId: a.quizId,
            score: a.score,
            total: a.total,
            answers: a.answers,
            clientTime: a.clientTime,
          };
          const checksum = await computeAttemptChecksum(fields);
          const res = await postSyncAttempt({ ...fields, checksum });
          deviceStore.updateAttempt(a.attemptId, {
            status: "synced",
            syncedAt: new Date().toISOString(),
            error: undefined,
            rejected: false,
            score: res.score,
            total: res.total,
            scoreCorrected: res.scoreCorrected,
            deviceScore: res.scoreCorrected ? a.score : undefined,
          });
        } catch (e) {
          if (e instanceof SyncRejectedError && e.permanent) {
            deviceStore.updateAttempt(a.attemptId, {
              status: "saved",
              rejected: true,
              error: e.message,
            });
            continue;
          }
          deviceStore.updateAttempt(a.attemptId, {
            status: "saved",
            error: e instanceof Error ? e.message : "Send failed",
          });
          break;
        }
      }
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    if (online && pendingCount > 0) void flush();
  }, [online, pendingCount, flush]);

  useEffect(() => {
    if (!online || pendingCount === 0) return;
    const t = setInterval(() => void flush(), 10000);
    return () => clearInterval(t);
  }, [online, pendingCount, flush]);
};
