/**
 * Mock API Client
 */

import type { RequestOptions } from "../client";
import type {
  UserProfile,
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest,
  CreateMessageRequest,
  Message,
  GetMessagesQuery,
  LoginRequest,
  LoginResponse,
  Message,
  RegisterRequest,
  SendMessageRequest,
  UpdateChatRequest,
  UpdateUserRequest,
  UserProfile,
} from "../types";
import { mockChats, mockMessages, mockUsers } from "./data";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface IApiClient {
  get<T>(endpoint: string, opts?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, opts?: RequestOptions): Promise<T>;
}

function currentUser(): UserProfile {
  return mockUsers[0];
}

export class MockApiClient implements IApiClient {
  async get<T>(endpoint: string, opts?: RequestOptions): Promise<T> {
    await delay();

    if (endpoint === "/users/me" || endpoint === "/api/users/me") {
      const token = localStorage.getItem("authToken");
      const activeUserId = Number(token?.replace("mock-token-", ""));
      const activeUser = mockUsers.find((user) => user.id === activeUserId) ?? mockUsers[0];
      return (activeUser as unknown) as T;
    }

    if (endpoint.startsWith("/users/") || endpoint.startsWith("/api/users/")) {
      const id = Number(endpoint.replace("/api/users/", "").replace("/users/", ""));
      const user = mockUsers.find((u) => u.id === id);
      if (user) return (user as unknown) as T;
      throw new Error("User not found");
    }

    if (endpoint === "/chats") {
      return mockChats as T;
    }

    if (endpoint.startsWith("/chats/search")) {
      const query = String(opts?.params?.query ?? "").toLowerCase();
      const chats = mockChats.filter((chat) => {
        const peer = mockUsers.find((user) => user.id === chat.peerUserId);
        return (
          chat.title?.toLowerCase().includes(query) ||
          peer?.username.toLowerCase().includes(query) ||
          [peer?.firstName, peer?.lastName].filter(Boolean).join(" ").toLowerCase().includes(query)
        );
      });
      return chats as T;
    }

    if (endpoint.startsWith("/chats/") && endpoint.endsWith("/messages")) {
      const [, , chatIdSegment] = endpoint.split("/");
      const chatId = Number(chatIdSegment);
      const params = opts?.params as GetMessagesQuery | undefined;
      const limit = Number(params?.limit ?? 50);
      const before = params?.before ? Number(params.before) : undefined;
      const search = String(params?.search ?? "").toLowerCase();

      let messages = mockMessages.filter((message) => message.chatId === chatId);
      if (before) {
        messages = messages.filter((message) => message.id < before);
      }
      if (search) {
        messages = messages.filter((message) => message.content.toLowerCase().includes(search));
      }

      return messages.slice(-limit) as T;
    }

    if (endpoint.startsWith("/chats/")) {
      const id = Number(endpoint.replace("/chats/", ""));
      const chat = mockChats.find((item) => item.id === id);
      if (!chat) throw new Error("Chat not found");
      return chat as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const message = mockMessages.find((item) => item.id === id);
      if (!message) throw new Error("Message not found");
      return message as T;
    }

    throw new Error(`Mock GET endpoint not implemented: ${endpoint}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    await delay();

    if (endpoint === "/auth/login") {
      const payload = body as LoginRequest & { username?: string };
      const identifier = (payload.emailOrUsername ?? payload.username ?? "").trim().toLowerCase();
      const user = mockUsers.find(
        (item) =>
          item.username.toLowerCase() === identifier ||
          (item.email?.toLowerCase() ?? "") === identifier
      );

      if (!user || payload.password.length < 4) {
        throw new Error("Invalid credentials");
      }

      return ({
        token: `mock-token-${user.id}`,
        refreshToken: `mock-refresh-${user.id}`,
        user,
      } as unknown) as T;
    }

    if (endpoint === "/messages") {
      const payload = body as CreateMessageRequest;
      const newMessage: Message = {
        id: mockMessages.length + 1,
        chatId,
        senderId: currentUser().id,
        content: payload.content,
        contentType: payload.contentType ?? "TEXT",
        replyToMessageId: payload.replyToMessageId,
        attachmentUrl: payload.attachmentUrl,
        attachmentName: payload.attachmentName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      };
      mockMessages.push(message);

      const chat = mockChats.find((item) => item.id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.updatedAt = message.updatedAt;
      }

      return message as T;
    }

    if (endpoint === "/users" || endpoint === "/auth/register") {
      const payload = body as CreateUserRequest;
      const newUser: UserProfile = {
        id: mockUsers.length + 1,
        username: payload.username || `user${mockUsers.length + 1}`,
        email: payload.email || `user${mockUsers.length + 1}@example.com`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.push(user);
      return user as T;
    }

    throw new Error(`Mock POST endpoint not implemented: ${endpoint}`);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.patch(endpoint, body);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    await delay();

    if (
      endpoint.startsWith("/users/") ||
      endpoint.startsWith("/api/users/") ||
      endpoint === "/api/users/me"
    ) {
      const token = localStorage.getItem("authToken");
      const activeUserId = Number(token?.replace("mock-token-", ""));
      const id =
        endpoint === "/api/users/me"
          ? activeUserId
          : Number(endpoint.replace("/api/users/", "").replace("/users/", ""));
      const userIndex = mockUsers.findIndex((u) => u.id === id);
      if (userIndex < 0) throw new Error("User not found");
      const patch = body as UpdateUserRequest;
      const updated = { ...currentUser(), ...patch, updatedAt: new Date().toISOString() };
      mockUsers[0] = updated;
      return updated as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const index = mockMessages.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("Message not found");
      mockMessages[index] = {
        ...mockMessages[index],
        ...(body as Partial<Message>),
        updatedAt: new Date().toISOString(),
      };
      return mockMessages[index] as T;
    }

    if (endpoint.startsWith("/chats/")) {
      const id = Number(endpoint.replace("/chats/", ""));
      const index = mockChats.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("Chat not found");
      mockChats[index] = {
        ...mockChats[index],
        ...(body as UpdateChatRequest),
        updatedAt: new Date().toISOString(),
      };
      return mockChats[index] as T;
    }

    throw new Error(`Mock PATCH endpoint not implemented: ${endpoint}`);
  }

  async delete<T>(endpoint: string): Promise<T> {
    await delay();

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const index = mockMessages.findIndex((item) => item.id === id);
      if (index >= 0) {
        mockMessages.splice(index, 1);
      }
      return undefined as T;
    }

    if (endpoint.startsWith("/chats/")) {
      const id = Number(endpoint.replace("/chats/", ""));
      const index = mockChats.findIndex((item) => item.id === id);
      if (index >= 0) {
        mockChats.splice(index, 1);
      }
      return undefined as T;
    }

    throw new Error(`Mock DELETE endpoint not implemented: ${endpoint}`);
  }
}
