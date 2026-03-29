import { apiClient, type RequestOptions } from "../client";
import type { Chat, ChatDetailsResponse, ChatParticipant, CreateChatRequest, UpdateChatRequest } from "../types";

export const chatsApi = {
  getAll(): Promise<Chat[]> {
    return apiClient.get("/chats");
  },

  getById(id: number): Promise<Chat> {
    return apiClient.get(`/chats/${id}`);
  },

  getDetails(id: number, options?: RequestOptions): Promise<ChatDetailsResponse> {
    return apiClient.get(`/chats/${id}`, options);
  },

  create(data: CreateChatRequest): Promise<Chat> {
    return apiClient.post("/chats", data);
  },

  update(id: number, data: UpdateChatRequest): Promise<Chat> {
    return apiClient.patch(`/chats/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/chats/${id}`);
  },

  removeParticipant(chatId: number, userId: number): Promise<void> {
    return apiClient.delete(`/chats/${chatId}/participants/${userId}`);
  },

  addParticipants(chatId: number, userIds: number[]): Promise<ChatParticipant[]> {
    return apiClient.post(`/chats/${chatId}/participants`, { userIds });
  },

  search(query: string): Promise<Chat[]> {
    return apiClient.get("/chats/search", {
      params: { query },
    });
  },
};
