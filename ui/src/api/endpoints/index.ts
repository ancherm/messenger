/**
 * API Endpoints
 * Централизованный экспорт всех endpoints
 */

export { usersApi } from "./users";
export { messagesApi } from "./messages";

// Импортировать и экспортировать все endpoints вместе для удобства
import { usersApi } from "./users";
import { messagesApi } from "./messages";

export const api = {
  users: usersApi,
  messages: messagesApi,
};
