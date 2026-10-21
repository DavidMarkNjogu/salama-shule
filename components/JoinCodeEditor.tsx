import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { deviceStore } from "../helpers/deviceStore";
import { useDeviceState } from "../helpers/useDeviceState";
import { useNetwork } from "../helpers/useNetwork";
import { postJoinCheck } from "../endpoints/classes/join_POST.schema";
import styles from "./JoinCodeEditor.module.css";

// Shows the class code this phone sends results under, and lets the student
// fix it. Fixing it also re-queues results the server refused.
export const JoinCodeEditor = () => {
  const { profile } = useDeviceState();
  const { online } = useNetwork();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = !profile?.joinCode;
  const open = editing || missing;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = value.trim().toUpperCase();
    if (next.length < 3) return;
    setError(null);
    if (online) {
      setBusy(true);
      try {
        const res = await postJoinCheck({ joinCode: next });
        if (!res.valid) {
          setError("That class code was not recognised. Ask your lecturer.");
          return;
        }
      } catch {
        // Could not check right now. It is checked again when results sync.
      } finally {
        setBusy(false);
      }
    }
    deviceStore.setJoinCode(next);
    setEditing(false);
    setValue("");
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.line}>
        Class code{" "}
        <span className={styles.mono}>{profile?.joinCode || "not set"}</span>{" "}
        {!missing && (
          <button
            type="button"
            className={styles.change}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Cancel" : "Change"}
          </button>
        )}
      </p>
      {open && (
        <form className={styles.form} onSubmit={submit}>
          {missing && (
            <p className={styles.note}>
              Enter the class code from your lecturer so your results can sync.
            </p>
          )}
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. SAFE-2026"
            maxLength={40}
            aria-label="Class code"
          />
          <Button type="submit" disabled={busy || value.trim().length < 3}>
            {busy ? "Checking..." : "Save class code"}
          </Button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      )}
    </div>
  );
};
