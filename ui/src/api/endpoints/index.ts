export { authApi } from "./auth";
export { usersApi } from "./users";
export { chatsApi } from "./chats";
export { messagesApi } from "./messages";
export { authApi } from "./auth";

// Импортировать и экспортировать все endpoints вместе для удобства
import { authApi } from "./auth";
import { usersApi } from "./users";
import { chatsApi } from "./chats";
import { messagesApi } from "./messages";

export const api = {
  auth: authApi,
  users: usersApi,
  chats: chatsApi,
  messages: messagesApi,
};
