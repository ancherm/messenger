import { apiClient } from "../client";
import type { Message, GetMessagesQuery, SendMessageRequest } from "../types";

export const messagesApi = {
  getById(id: number): Promise<Message> {
    return apiClient.get(`/messages/${id}`);
  },

  getChatHistory(chatId: number, params?: GetMessagesQuery): Promise<Message[]> {
    return apiClient.get(`/chats/${chatId}/messages`, { params });
  },

  send(chatId: number, data: SendMessageRequest): Promise<Message> {
    return apiClient.post(`/chats/${chatId}/messages`, {
      contentType: "TEXT",
      ...data,
    });
  },

  update(id: number, content: string): Promise<Message> {
    return apiClient.patch(`/messages/${id}`, { content });
  },

  pin(chatId: number, messageId: number): Promise<void> {
    return apiClient.post(`/chats/${chatId}/messages/${messageId}/pin`);
  },

  unpin(chatId: number, messageId: number): Promise<void> {
    return apiClient.delete(`/chats/${chatId}/messages/${messageId}/pin`);
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/messages/${id}`);
  },
};
