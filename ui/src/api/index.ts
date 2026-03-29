/**
 * API Module
 * Главный экспорт для всех API функций и типов
 */

export { apiClient, type ApiResponse, type RequestOptions } from "./client";
export { api, authApi, usersApi, messagesApi } from "./endpoints";
export type {
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  AuthTokens,
  AuthResponse,
  Message,
  CreateMessageRequest,
  GetMessagesQuery,
  Chat,
  CreateChatRequest,
  PaginatedResponse,
  ApiErrorResponse,
} from "./types";
