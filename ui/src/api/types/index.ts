/**
 * API Types
 * Определения типов для API запросов и ответов
 */

// ─── User Types ────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

// ─── Message Types ────────────────────────────────────────────

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
}

export interface CreateMessageRequest {
  receiverId: number;
  content: string;
}

export interface GetMessagesQuery extends Record<string, string | number | boolean | undefined> {
  userId?: number;
  limit?: number;
  offset?: number;
}

// ─── Chat Types ────────────────────────────────────────────────

export interface Chat {
  id: number;
  participantIds: number[];
  lastMessage?: Message;
  updatedAt: string;
  createdAt: string;
}

export interface CreateChatRequest {
  participantIds: number[];
}

// ─── API Response Types ────────────────────────────────────────

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
