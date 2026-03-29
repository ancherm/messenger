import { API_BASE_URL, apiClient, resolveApiUrl } from "../client";
import type { PaginatedResponse, CreateUserRequest, UpdateUserRequest, UserProfile } from "../types";

type SearchResponse = PaginatedResponse<UserProfile> | { content: UserProfile[] };

export const usersApi = {
  getMe(): Promise<UserProfile> {
    return apiClient.get("/users/me");
  },

  getById(id: number): Promise<UserProfile> {
    return apiClient.get(`/users/${id}`);
  },

  create(data: CreateUserRequest): Promise<UserProfile> {
    return apiClient.post("/users", data);
  },

  async getByUsername(username: string): Promise<UserProfile> {
    const users = await this.search(username);
    const match = users.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!match) {
      throw new Error("User not found");
    }

    return match;
  },

  async search(query: string, limit = 10): Promise<UserProfile[]> {
    const response = await apiClient.get<SearchResponse>("/users", {
      params: { query, size: limit },
    });

    return "content" in response ? response.content : response.data;
  },

  updateMe(data: UpdateUserRequest): Promise<UserProfile> {
    return apiClient.patch("/users/me", data);
  },

  updateStatus(status: "ONLINE" | "OFFLINE"): Promise<UserProfile> {
    return apiClient.patch("/users/me/status", { status });
  },

  async updateAvatar(id: number, file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(resolveApiUrl(API_BASE_URL, `/users/${id}/avatar`), {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<UserProfile>;
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },

  getContacts(id: number): Promise<UserProfile[]> {
    return apiClient.get(`/users/${id}/contacts`);
  },

  addContact(userId: number, contactId: number): Promise<UserProfile> {
    return apiClient.post(`/users/${userId}/contacts/${contactId}`, {});
  },

  removeContact(userId: number, contactId: number): Promise<void> {
    return apiClient.delete(`/users/${userId}/contacts/${contactId}`);
  },
};
