import { apiClient } from "../client";
import type { Chat, ChatDetailsResponse, CreateChatRequest, UpdateChatRequest } from "../types";

export const chatsApi = {
  getAll(): Promise<Chat[]> {
    return apiClient.get("/chats");
  },

  getById(id: number): Promise<Chat> {
    return apiClient.get(`/chats/${id}`);
  },

  getDetails(id: number): Promise<ChatDetailsResponse> {
    return apiClient.get(`/chats/${id}`);
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

  search(query: string): Promise<Chat[]> {
    return apiClient.get("/chats/search", {
      params: { query },
    });
  },
};
