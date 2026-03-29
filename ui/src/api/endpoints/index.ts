export { authApi } from "./auth";
export { usersApi } from "./users";
export { chatsApi } from "./chats";
export { messagesApi } from "./messages";

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
