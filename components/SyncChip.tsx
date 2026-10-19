import { HardDrive, RefreshCw, CheckCheck } from "lucide-react";
import type { AttemptStatus } from "../helpers/deviceStore";
import styles from "./SyncChip.module.css";

const COPY = {
  saved: { label: "Saved on device", Icon: HardDrive },
  syncing: { label: "Syncing", Icon: RefreshCw },
  synced: { label: "Synced", Icon: CheckCheck },
} as const;

export const SyncChip = ({
  status,
  className,
}: {
  status: AttemptStatus;
  className?: string;
}) => {
  const { label, Icon } = COPY[status];
  return (
    <span className={`${styles.chip} ${styles[status]} ${className ?? ""}`}>
      <Icon size={14} className={status === "syncing" ? styles.spin : ""} />
      {label}
    </span>
  );
};
