/**
 * Простые мок-данные
 */
import type { UserProfile, Message } from "../types";

export const mockUsers: UserProfile[] = [
  {
    id: 1,
    username: "johndoe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    bio: "Sample bio",
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "alice",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Brown",
    phone: "+1234567000",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    bio: "Frontend engineer",
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockMessages: Message[] = [
  {
    id: 1,
    senderId: 1,
    receiverId: 2,
    content: "Привет!",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 2,
    senderId: 2,
    receiverId: 1,
    content: "Здорово, как дела?",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    read: false,
  },
];
