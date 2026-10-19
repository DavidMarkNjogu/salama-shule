import { useEffect, useState } from "react";
import { useDeviceState } from "./useDeviceState";

// `online` is false when the browser is offline OR the demo "simulate offline" switch is on.
export const useNetwork = () => {
  const { simulateOffline } = useDeviceState();
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return { online: browserOnline && !simulateOffline, browserOnline, simulateOffline };
};
