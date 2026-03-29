import { useEffect, useRef } from "react";
import { usersApi } from "../api";
import { emitUserStatusChanged, type PresenceStatus } from "./presenceEvents";

const IDLE_TIMEOUT_MS = 60 * 1000;

export default function SessionPresence() {
  const idleTimerRef = useRef<number | null>(null);
  const requestInFlightRef = useRef(false);
  const currentStatusRef = useRef<PresenceStatus | null>(null);
  const desiredStatusRef = useRef<PresenceStatus>("ONLINE");

  useEffect(() => {
    let disposed = false;

    const flushStatus = async () => {
      if (requestInFlightRef.current || disposed) {
        return;
      }

      const nextStatus = desiredStatusRef.current;
      if (currentStatusRef.current === nextStatus) {
        return;
      }

      requestInFlightRef.current = true;
      const offlineSeenAt = nextStatus === "OFFLINE" ? new Date().toISOString() : undefined;

      try {
        const updatedUser = await usersApi.updateStatus(nextStatus);
        currentStatusRef.current = nextStatus;
        emitUserStatusChanged({
          status: nextStatus,
          active: nextStatus === "ONLINE",
          lastSeenAt:
            nextStatus === "OFFLINE" ? updatedUser.lastSeenAt ?? offlineSeenAt : updatedUser.lastSeenAt,
        });
      } catch {
        currentStatusRef.current = nextStatus;
        emitUserStatusChanged({
          status: nextStatus,
          active: nextStatus === "ONLINE",
          lastSeenAt: nextStatus === "OFFLINE" ? offlineSeenAt : undefined,
        });
      } finally {
        requestInFlightRef.current = false;
        if (!disposed && currentStatusRef.current !== desiredStatusRef.current) {
          void flushStatus();
        }
      }
    };

    const queueStatus = (status: PresenceStatus) => {
      desiredStatusRef.current = status;
      void flushStatus();
    };

    const scheduleOffline = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
        queueStatus("OFFLINE");
      }, IDLE_TIMEOUT_MS);
    };

    const handleActivity = () => {
      scheduleOffline();

      if (currentStatusRef.current !== "ONLINE" || desiredStatusRef.current !== "ONLINE") {
        queueStatus("ONLINE");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "focus",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleActivity();

    return () => {
      disposed = true;
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return null;
}
