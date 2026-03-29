/**
 * Messages API Endpoints
 * Все методы для работы с сообщениями
 */

import { apiClient } from "../client";
import type {
  Message,
  CreateMessageRequest,
  GetMessagesQuery,
  PaginatedResponse,
} from "../types";

export const messagesApi = {
  /**
   * Получить сообщения с конкретным пользователем
   */
  getConversation(
    userId: number,
    params?: GetMessagesQuery
  ): Promise<PaginatedResponse<Message>> {
    return apiClient.get(`/messages/conversation/${userId}`, { params });
  },

  /**
   * Получить все сообщения пользователя
   */
  getAll(params?: GetMessagesQuery): Promise<PaginatedResponse<Message>> {
    return apiClient.get("/messages", { params });
  },

  /**
   * Получить сообщение по ID
   */
  getById(id: number): Promise<Message> {
    return apiClient.get(`/messages/${id}`);
  },

  /**
   * Отправить сообщение
   */
  send(data: CreateMessageRequest): Promise<Message> {
    return apiClient.post("/messages", data);
  },

  /**
   * Редактировать сообщение
   */
  update(id: number, content: string): Promise<Message> {
    return apiClient.put(`/messages/${id}`, { content });
  },

  /**
   * Удалить сообщение
   */
  delete(id: number): Promise<void> {
    return apiClient.delete(`/messages/${id}`);
  },

  /**
   * Отметить сообщение как прочитанное
   */
  markAsRead(id: number): Promise<Message> {
    return apiClient.put(`/messages/${id}/read`, {});
  },

  /**
   * Отметить все сообщения как прочитанные
   */
  markAllAsRead(userId: number): Promise<void> {
    return apiClient.put(`/messages/user/${userId}/read-all`, {});
  },

  /**
   * Получить непрочитанные сообщения
   */
  getUnread(): Promise<PaginatedResponse<Message>> {
    return apiClient.get("/messages/unread");
  },

  /**
   * Получить количество непрочитанных сообщений
   */
  getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get("/messages/unread/count");
  },
};
