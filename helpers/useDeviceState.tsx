import { useSyncExternalStore } from "react";
import { deviceStore } from "./deviceStore";

export const useDeviceState = () =>
  useSyncExternalStore(deviceStore.subscribe, deviceStore.getSnapshot);
