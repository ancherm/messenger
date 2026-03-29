/**
 * API Types
 */

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL";
export type MessageContentType = "TEXT" | "IMAGE" | "FILE";
export type UserStatus = "ONLINE" | "OFFLINE" | "AWAY";

export interface UserProfile {
  id: number;
  username: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  status?: UserStatus | string;
  active?: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateUserRequest extends RegisterRequest {
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface AuthResponse extends AuthTokens {
  user?: UserProfile;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  status?: UserStatus | string;
}

export interface Message {
  id: number;
  chatId?: number;
  senderId: number;
  receiverId?: number;
  content: string;
  contentType?: MessageContentType;
  replyToMessageId?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
}

export interface SendMessageRequest {
  content: string;
  contentType?: MessageContentType;
  replyToMessageId?: number;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface GetMessagesQuery extends Record<string, string | number | boolean | undefined> {
  limit?: number;
  before?: number;
  search?: string;
}

export interface ChatParticipant {
  id: number;
  userId: number;
  role?: string;
  user?: UserProfile;
  username?: string;
  joinedAt?: string;
  leftAt?: string | null;
}

export interface Chat {
  id: number;
  chatId?: number;
  type: ChatType;
  title?: string;
  description?: string;
  avatarUrl?: string;
  participantIds?: number[];
  participants?: ChatParticipant[];
  peerUserId?: number;
  lastMessage?: Message;
  updatedAt: string;
  createdAt: string;
}

export interface ChatDetailsResponse {
  chat: Chat;
  participants: ChatParticipant[];
}

export interface CreateChatRequest {
  type: ChatType;
  title?: string;
  description?: string;
  peerUserId?: number;
  participantIds?: number[];
}

export interface UpdateChatRequest {
  title?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
