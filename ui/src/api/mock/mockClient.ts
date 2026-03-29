/**
 * Mock API Client
 * Используется при VITE_API_MOCK=true
 */

import type { RequestOptions } from "../client";
import type {
  UserProfile,
  UpdateUserRequest,
  CreateMessageRequest,
  Message,
  GetMessagesQuery,
} from "../types";
import { mockUsers, mockMessages } from "./data";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface IApiClient {
  get<T>(endpoint: string, opts?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, opts?: RequestOptions): Promise<T>;
}

export class MockApiClient implements IApiClient {
  async get<T>(endpoint: string, opts?: RequestOptions): Promise<T> {
    await delay();

    if (endpoint === "/users/me") {
      return (mockUsers[0] as unknown) as T;
    }

    if (endpoint.startsWith("/users/")) {
      const id = Number(endpoint.replace("/users/", ""));
      const user = mockUsers.find((u) => u.id === id);
      if (user) return (user as unknown) as T;
      throw new Error("User not found");
    }

    if (endpoint === "/messages") {
      const params = opts?.params as GetMessagesQuery | undefined;
      const offset = Number(params?.offset ?? 0);
      const limit = Number(params?.limit ?? 100);
      const data = mockMessages.slice(offset, offset + limit);
      return ({ data, total: mockMessages.length, limit, offset } as unknown) as T;
    }

    if (endpoint.startsWith("/messages/conversation/")) {
      const userId = Number(endpoint.split("/").pop());
      const all = mockMessages.filter((m) => m.senderId === userId || m.receiverId === userId);
      const offset = Number((opts?.params as GetMessagesQuery | undefined)?.offset ?? 0);
      const limit = Number((opts?.params as GetMessagesQuery | undefined)?.limit ?? 100);
      const data = all.slice(offset, offset + limit);
      return ({ data, total: all.length, limit, offset } as unknown) as T;
    }

    if (endpoint === "/messages/unread") {
      const data = mockMessages.filter((m) => !m.read);
      return ({ data, total: data.length, limit: data.length, offset: 0 } as unknown) as T;
    }

    if (endpoint === "/messages/unread/count") {
      const count = mockMessages.filter((m) => !m.read).length;
      return ({ count } as unknown) as T;
    }

    throw new Error(`Mock GET endpoint not implemented: ${endpoint}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    await delay();

    if (endpoint === "/messages") {
      const payload = body as CreateMessageRequest;
      const newMessage: Message = {
        id: mockMessages.length + 1,
        senderId: 1,
        receiverId: payload.receiverId,
        content: payload.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      };
      mockMessages.push(newMessage);
      return (newMessage as unknown) as T;
    }

    if (endpoint === "/users") {
      const payload = body as Partial<UserProfile>;
      const newUser: UserProfile = {
        id: mockUsers.length + 1,
        username: payload.username || "newuser",
        email: payload.email || "new@example.com",
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return (newUser as unknown) as T;
    }

    throw new Error(`Mock POST endpoint not implemented: ${endpoint}`);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    await delay();

    if (endpoint.startsWith("/users/")) {
      const id = Number(endpoint.replace("/users/", ""));
      const userIndex = mockUsers.findIndex((u) => u.id === id);
      if (userIndex < 0) throw new Error("User not found");
      const patch = body as UpdateUserRequest;
      const updated = { ...mockUsers[userIndex], ...patch, updatedAt: new Date().toISOString() };
      mockUsers[userIndex] = updated;
      return (updated as unknown) as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const messageIndex = mockMessages.findIndex((m) => m.id === id);
      if (messageIndex < 0) throw new Error("Message not found");

      if (endpoint.endsWith("/read")) {
        mockMessages[messageIndex].read = true;
        mockMessages[messageIndex].updatedAt = new Date().toISOString();
        return (mockMessages[messageIndex] as unknown) as T;
      }

      const payload = body as { content?: string };
      if (payload.content !== undefined) {
        mockMessages[messageIndex].content = payload.content;
        mockMessages[messageIndex].updatedAt = new Date().toISOString();
      }
      return (mockMessages[messageIndex] as unknown) as T;
    }

    throw new Error(`Mock PUT endpoint not implemented: ${endpoint}`);
  }

  async delete<T>(endpoint: string): Promise<T> {
    await delay();

    if (endpoint.startsWith("/users/")) {
      const id = Number(endpoint.replace("/users/", ""));
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index >= 0) mockUsers.splice(index, 1);
      return (undefined as unknown) as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const index = mockMessages.findIndex((m) => m.id === id);
      if (index >= 0) mockMessages.splice(index, 1);
      return (undefined as unknown) as T;
    }

    throw new Error(`Mock DELETE endpoint not implemented: ${endpoint}`);
  }
}
