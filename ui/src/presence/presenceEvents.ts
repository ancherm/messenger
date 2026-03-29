export type PresenceStatus = "ONLINE" | "OFFLINE";

export type UserStatusChangedDetail = {
  status: PresenceStatus;
  active: boolean;
  lastSeenAt?: string;
};

const USER_STATUS_CHANGED_EVENT = "user-status-changed";

export function emitUserStatusChanged(detail: UserStatusChangedDetail): void {
  window.dispatchEvent(new CustomEvent<UserStatusChangedDetail>(USER_STATUS_CHANGED_EVENT, { detail }));
}

export function subscribeUserStatusChanged(
  listener: (detail: UserStatusChangedDetail) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<UserStatusChangedDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(USER_STATUS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(USER_STATUS_CHANGED_EVENT, handler);
}
