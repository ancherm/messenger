import { apiClient, resolveApiUrl } from "../client";
import type { UserProfile, CreateUserRequest, UpdateUserRequest } from "../types";

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
  },
};
