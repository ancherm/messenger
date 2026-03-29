import { API_BASE_URL, apiClient } from "../client";
import type { PaginatedResponse, UpdateUserRequest, UserProfile } from "../types";

type SearchResponse = PaginatedResponse<UserProfile> | { content: UserProfile[] };

export const usersApi = {
  getMe(): Promise<UserProfile> {
    return apiClient.get("/api/users/me");
  },

  getById(id: number): Promise<UserProfile> {
    return apiClient.get(`/api/users/${id}`);
  },

  create(data: CreateUserRequest): Promise<UserProfile> {
    return apiClient.post("/users", data);
  },

  updateMe(data: UpdateUserRequest): Promise<UserProfile> {
    return apiClient.patch("/users/me", data);
  },

  updateAvatar(id: number, file: File): Promise<UserProfile> {
    if (import.meta.env.VITE_API_MOCK !== "false") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            const updatedUser = await usersApi.updateMe({
              avatarUrl: reader.result as string,
            });
            resolve(updatedUser);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read avatar file"));
        };

        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append("avatar", file);

    return fetch(
      resolveApiUrl(import.meta.env.VITE_API_URL || "/api", `/users/${id}/avatar`),
      {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    ).then((res) => res.json());
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
    const response = await apiClient.get<SearchResponse>("/api/users", {
      params: { query, size: limit },
    });

    return "content" in response ? response.content : response.data;
  },

  update(id: number, data: UpdateUserRequest): Promise<UserProfile> {
    void id;
    return apiClient.patch("/api/users/me", data);
  },

  async updateAvatar(id: number, file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_BASE_URL}/api/users/${id}/avatar`, {
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
    return apiClient.delete(`/api/users/${id}`);
  },

  getContacts(id: number): Promise<UserProfile[]> {
    return apiClient.get(`/api/users/${id}/contacts`);
  },

  addContact(userId: number, contactId: number): Promise<UserProfile> {
    return apiClient.post(`/api/users/${userId}/contacts/${contactId}`, {});
  },

  removeContact(userId: number, contactId: number): Promise<void> {
    return apiClient.delete(`/api/users/${userId}/contacts/${contactId}`);
  },
};
