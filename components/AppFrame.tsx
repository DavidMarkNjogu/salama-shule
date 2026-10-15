import { NavLink, Link } from "react-router-dom";
import { Wifi, WifiOff, BookOpenCheck } from "lucide-react";
import { Switch } from "./Switch";
import { deviceStore } from "../helpers/deviceStore";
import { useDeviceState } from "../helpers/useDeviceState";
import { useNetwork } from "../helpers/useNetwork";
import { useSyncEngine } from "../helpers/useSyncEngine";
import styles from "./AppFrame.module.css";

export const AppFrame = ({ children }: { children: React.ReactNode }) => {
  useSyncEngine();
  const { attempts } = useDeviceState();
  const { online, simulateOffline } = useNetwork();
  const pending = attempts.filter((a) => a.status !== "synced").length;

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.top}>
          <Link to="/" className={styles.brand}>
            <BookOpenCheck size={22} strokeWidth={1.7} />
            <span className={styles.brandName}>Salama Shule</span>
          </Link>
          <span
            className={`${styles.net} ${online ? styles.online : styles.offline}`}
            role="status"
          >
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            {online ? "Online" : "Offline"}
            {pending > 0 && (
              <span className={styles.pending}>{pending} waiting to sync</span>
            )}
          </span>
        </div>
        <div className={styles.bottom}>
          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
            >
              Study
            </NavLink>
            <NavLink
              to="/lecturer"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
            >
              Lecturer view
            </NavLink>
          </nav>
          <label className={styles.demo}>
            <span>Demo: simulate offline</span>
            <Switch
              checked={simulateOffline}
              onCheckedChange={(v) => deviceStore.setSimulateOffline(v)}
              aria-label="Simulate offline"
            />
          </label>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        Practice quizzes only. Timestamps come from the device clock. Demo build
        for the Riara Design Thinking Hackathon.
      </footer>
    </div>
  );
};
