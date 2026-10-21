import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Download, WifiOff } from "lucide-react";
import { Button } from "../components/Button";
import { LecturerBar, CorrectedFlag } from "../components/LecturerBar";
import { getAttemptsList } from "../endpoints/attempts/list_GET.schema";
import { useNetwork } from "../helpers/useNetwork";
import styles from "./lecturer.module.css";

const csvCell = (v: string | number | boolean) =>
  `"${String(v).replace(/"/g, '""')}"`;

export default function LecturerPage() {
  const { online } = useNetwork();
  const q = useQuery({
    queryKey: ["attempts"],
    queryFn: () => getAttemptsList(),
    enabled: online,
    refetchInterval: online ? 5000 : false,
  });

  const rows = q.data?.attempts ?? [];

  const exportCsv = () => {
    const header = [
      "student_code",
      "student_name",
      "class_code",
      "quiz",
      "score",
      "total",
      "phone_score",
      "re_marked_by_server",
      "taken_on_device_at",
      "received_by_server_at",
    ];
    const lines = rows.map((r) =>
      [
        r.studentCode,
        r.studentName,
        r.joinCode,
        r.quizId,
        r.score,
        r.total,
        r.clientScore,
        r.scoreCorrected,
        new Date(r.clientTime).toISOString(),
        new Date(r.syncedAt).toISOString(),
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salama-shule-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Lecturer view | Salama Shule</title>
      </Helmet>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Lecturer view</h1>
          <p className={styles.sub}>
            Results appear here after a student&apos;s phone syncs them. Scores
            are the ones the server worked out from the answers. This page
            refreshes every few seconds.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download size={16} /> Export CSV
        </Button>
      </header>

      <LecturerBar classCodes={q.data?.classCodes ?? []} />

      {!online && (
        <p className={styles.offline}>
          <WifiOff size={16} /> You are offline, so synced results cannot be
          loaded right now.
        </p>
      )}

      {q.isFetching && !q.data ? (
        <div className={styles.skeleton} aria-label="Loading" />
      ) : q.isError ? (
        <p className={styles.error}>
          {q.error instanceof Error ? q.error.message : "Could not load results."}
        </p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>
          No synced results yet. Finish the quiz on a phone and reconnect.
        </p>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.attemptId} className={styles.row}>
              <div>
                <p className={styles.name}>{r.studentName}</p>
                <p className={styles.meta}>
                  <span className={styles.mono}>{r.studentCode}</span> · class{" "}
                  {r.joinCode} · taken {new Date(r.clientTime).toLocaleString()}
                </p>
                <p className={styles.meta}>
                  Received {new Date(r.syncedAt).toLocaleTimeString()}
                </p>
                {r.scoreCorrected && (
                  <CorrectedFlag deviceScore={r.clientScore} total={r.total} />
                )}
              </div>
              <p className={styles.score}>
                {r.score}
                <span>/{r.total}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
