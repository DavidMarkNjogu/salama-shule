import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "../helpers/useAuth";
import styles from "./LecturerBar.module.css";

export const LecturerBar = ({
  classCodes,
}: {
  classCodes: { code: string; label: string }[];
}) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const email = authState.type === "authenticated" ? authState.user.email : null;

  return (
    <div className={styles.bar}>
      <div className={styles.codes}>
        <KeyRound size={16} />
        <span className={styles.label}>Class join code</span>
        {classCodes.length === 0 ? (
          <span className={styles.muted}>none</span>
        ) : (
          classCodes.map((c) => (
            <span key={c.code} className={styles.code} title={c.label}>
              {c.code}
            </span>
          ))
        )}
      </div>
      <div className={styles.who}>
        {email && <span className={styles.muted}>{email}</span>}
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <LogOut size={16} /> Sign out
        </Button>
      </div>
    </div>
  );
};

export const CorrectedFlag = ({
  deviceScore,
  total,
}: {
  deviceScore: number;
  total: number;
}) => (
  <span className={styles.flag}>
    <ShieldAlert size={13} /> Re-marked by server (phone said {deviceScore}/
    {total})
  </span>
);
