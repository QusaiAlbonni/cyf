export enum AuthEventType {
  USER_SESSIONS_CLEARED = 'user.sessions.cleared',
}

export interface UserSessionsClearedPayload {
  userId: number;
}
