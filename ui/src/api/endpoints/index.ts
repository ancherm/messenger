/**
 * API Endpoints
 * Централизованный экспорт всех endpoints
 */

export { usersApi } from "./users";
export { messagesApi } from "./messages";
export { authApi } from "./auth";

// Импортировать и экспортировать все endpoints вместе для удобства
import { authApi } from "./auth";
import { usersApi } from "./users";
import { messagesApi } from "./messages";

export const api = {
  auth: authApi,
  users: usersApi,
  messages: messagesApi,
};
