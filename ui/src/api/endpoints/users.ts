/**
 * Users API Endpoints
 * Все методы для работы с пользователями
 */

import { apiClient } from "../client";
import type {
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types";

export const usersApi = {
  /**
   * Получить профиль текущего пользователя
   */
  getMe(): Promise<UserProfile> {
    return apiClient.get("/users/me");
  },

  /**
   * Получить профиль по ID
   */
  getById(id: number): Promise<UserProfile> {
    return apiClient.get(`/users/${id}`);
  },

  /**
   * Получить пользователя по username
   */
  getByUsername(username: string): Promise<UserProfile> {
    return apiClient.get("/users/search", {
      params: { username },
    });
  },

  /**
   * Поиск пользователей
   */
  search(query: string, limit = 10): Promise<UserProfile[]> {
    return apiClient.get("/users/search", {
      params: { q: query, limit },
    });
  },

  /**
   * Создать нового пользователя
   */
  create(data: CreateUserRequest): Promise<UserProfile> {
    return apiClient.post("/users", data);
  },

  /**
   * Обновить профиль пользователя
   */
  update(id: number, data: UpdateUserRequest): Promise<UserProfile> {
    return apiClient.put(`/users/${id}`, data);
  },

  /**
   * Обновить аватар пользователя
   */
  updateAvatar(id: number, file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);
    
    return fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users/${id}/avatar`, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    }).then(res => res.json());
  },

  /**
   * Удалить пользователя
   */
  delete(id: number): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },

  /**
   * Получить список контактов пользователя
   */
  getContacts(id: number): Promise<UserProfile[]> {
    return apiClient.get(`/users/${id}/contacts`);
  },

  /**
   * Добавить контакт
   */
  addContact(userId: number, contactId: number): Promise<UserProfile> {
    return apiClient.post(`/users/${userId}/contacts/${contactId}`, {});
  },

  /**
   * Удалить контакт
   */
  removeContact(userId: number, contactId: number): Promise<void> {
    return apiClient.delete(`/users/${userId}/contacts/${contactId}`);
  },
};
