import type { RequestOptions } from "../client";
import type {
  Chat,
  CreateChatRequest,
  CreateUserRequest,
  GetMessagesQuery,
  LoginRequest,
  Message,
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

function getActiveUser(): UserProfile {
  const token = localStorage.getItem("authToken");
  const activeUserId = Number(token?.replace("mock-token-", ""));
  return mockUsers.find((user) => user.id === activeUserId) ?? mockUsers[0];
}

export class MockApiClient implements IApiClient {
  async get<T>(endpoint: string, opts?: RequestOptions): Promise<T> {
    await delay();

    if (endpoint === "/users/me") {
      return getActiveUser() as T;
    }

    if (endpoint.startsWith("/users/")) {
      const id = Number(endpoint.replace("/users/", ""));
      const user = mockUsers.find((item) => item.id === id);
      if (!user) {
        throw new Error("User not found");
      }
      return user as T;
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
      if (!chat) {
        throw new Error("Chat not found");
      }
      return chat as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const message = mockMessages.find((item) => item.id === id);
      if (!message) {
        throw new Error("Message not found");
      }
      return message as T;
    }

    throw new Error(`Mock GET endpoint not implemented: ${endpoint}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    await delay();

    if (endpoint === "/auth/login") {
      const payload = body as { username?: string } & LoginRequest;
      const identifier = (payload.emailOrUsername ?? payload.username ?? "").trim().toLowerCase();
      const user = mockUsers.find(
        (item) =>
          item.username.toLowerCase() === identifier ||
          (item.email?.toLowerCase() ?? "") === identifier
      );

      if (!user || payload.password.length < 4) {
        throw new Error("Invalid credentials");
      }

      return {
        token: `mock-token-${user.id}`,
        refreshToken: `mock-refresh-${user.id}`,
        user,
      } as T;
    }

    if (endpoint === "/auth/register" || endpoint === "/users") {
      const payload = body as CreateUserRequest;
      const user: UserProfile = {
        id: mockUsers.length + 1,
        username: payload.username,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.push(user);
      return user as T;
    }

    if (endpoint === "/chats") {
      const payload = body as CreateChatRequest;
      const chat: Chat = {
        id: mockChats.length + 1,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        peerUserId: payload.peerUserId,
        participantIds:
          payload.type === "PRIVATE"
            ? [getActiveUser().id, payload.peerUserId ?? getActiveUser().id]
            : [getActiveUser().id, ...(payload.participantIds ?? [])],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockChats.push(chat);
      return chat as T;
    }

    if (endpoint.startsWith("/chats/") && endpoint.endsWith("/messages")) {
      const [, , chatIdSegment] = endpoint.split("/");
      const chatId = Number(chatIdSegment);
      const payload = body as SendMessageRequest;
      const message: Message = {
        id: mockMessages.length + 1,
        chatId,
        senderId: getActiveUser().id,
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

    throw new Error(`Mock POST endpoint not implemented: ${endpoint}`);
  }

  async put<T>(endpoint: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.patch(endpoint, body, opts);
  }

  async patch<T>(endpoint: string, body?: unknown, _opts?: RequestOptions): Promise<T> {
    await delay();

    if (endpoint === "/users/me") {
      const patch = body as UpdateUserRequest;
      const activeUser = getActiveUser();
      const userIndex = mockUsers.findIndex((user) => user.id === activeUser.id);
      if (userIndex < 0) {
        throw new Error("User not found");
      }

      const updated = { ...mockUsers[userIndex], ...patch, updatedAt: new Date().toISOString() };
      mockUsers[userIndex] = updated;
      return updated as T;
    }

    if (endpoint.startsWith("/messages/")) {
      const id = Number(endpoint.replace("/messages/", ""));
      const index = mockMessages.findIndex((item) => item.id === id);
      if (index < 0) {
        throw new Error("Message not found");
      }

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
      if (index < 0) {
        throw new Error("Chat not found");
      }

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
