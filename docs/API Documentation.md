Этот проект представляет собой backend-сервис для системы управления событиями и бронированиями билетов, аналогичный Yandex Afisha. Он предоставляет полный набор RESTful endpoints для работы с пользователями, ролями, местами проведения (venues), местами (seats), событиями (events), экземплярами мест (seat instances), бронированиями (bookings) и платежами (payments).

API разработан для параллельной разработки frontend и backend: все endpoints описаны с указанием методов, путей, параметров запроса, тел запроса/ответа (в формате JSON), кодов ответов и аутентификации. Аутентификация осуществляется через JWT-токены (Bearer Token) для защищенных endpoints. Неаутентифицированные пользователи могут просматривать публичные данные (например, список событий).

База данных построена на основе предоставленной ER-диаграммы (PostgreSQL с использованием UUID для PK). Все timestamps в UTC, если не указано иное.



## Endpoints

### 1. Авторизация и Пользователи (/users)

Управление пользователями и ролями.

| Метод  | Путь                             | Описание                         | Аутентификация     | Запрос                                                                                  | Ответ                                                                                                                  |
| ------ | -------------------------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| POST   | /auth/register                   | Регистрация пользователя         | Нет                | `{ "full_name": "string", "email": "string", "password": "string", "phone": "string" }` | 201: `{ "user_id": "UUID", "message": "Registered" }`                                                                  |
| POST   | /auth/login                      | Логин                            | Нет                | `{ "email": "string", "password": "string" }`                                           | 200: `{ "token": "JWT", "user": { "id": "UUID", "full_name": "string", ... } }`                                        |
| GET    | /users/me                        | Получить свой профиль            | Пользователь       | -                                                                                       | 200: `{ "id": "UUID", "full_name": "string", "email": "string", "phone": "string", "roles": ["array of role names"] }` |
| PUT    | /users/me                        | Обновить профиль                 | Пользователь       | `{ "full_name": "string", "phone": "string" }` (partial)                                | 200: Updated user object                                                                                               |
| DELETE | /users/me                        | Удалить аккаунт (soft delete)    | Пользователь       | -                                                                                       | 204: No content                                                                                                        |
| GET    | /users                           | Список пользователей (пагинация) | Admin              | Query: `search` (по email/full_name)                                                    | 200: `{ "users": [array of user objects], "total": int }`                                                              |
| GET    | /users/{user_id}                 | Получить пользователя по ID      | Admin или владелец | -                                                                                       | 200: User object                                                                                                       |
| POST   | /users/{user_id}/roles           | Назначить роль                   | Admin              | `{ "role_id": "UUID" }`                                                                 | 201: `{ "message": "Role assigned" }`                                                                                  |
| DELETE | /users/{user_id}/roles/{role_id} | Удалить роль                     | Admin              | -                                                                                       | 204: No content                                                                                                        |

### 2. Роли (/roles) (optional) - TODO

Управление ролями (e.g., "user", "organizer", "admin").

| Метод  | Путь             | Описание      | Аутентификация | Запрос                                                                    | Ответ                      |
| ------ | ---------------- | ------------- | -------------- | ------------------------------------------------------------------------- | -------------------------- |
| POST   | /roles           | Создать роль  | Admin          | `{ "name": "string", "display_name": "string", "description": "string" }` | 201: Role object           |
| GET    | /roles           | Список ролей  | Admin          | -                                                                         | 200: Array of role objects |
| GET    | /roles/{role_id} | Получить роль | Admin          | -                                                                         | 200: Role object           |
| PUT    | /roles/{role_id} | Обновить роль | Admin          | Partial role object                                                       | 200: Updated role          |
| DELETE | /roles/{role_id} | Удалить роль  | Admin          | -                                                                         | 204: No content            |

### 3. Места проведения (/venues)

Управление venues (залы, стадионы) и seats.

|Метод|Путь|Описание|Аутентификация|Запрос|Ответ|
|---|---|---|---|---|---|
|POST|/venues|Создать venue|Organizer/Admin|`{ "name": "string", "address": "string", "city": "string", "timezone": "string", "seat_map": {json object} }`|201: Venue object|
|GET|/venues|Список venues (пагинация, поиск по city/name)|Гость|Query: `city`, `search`|200: `{ "venues": [array], "total": int }`|
|GET|/venues/{venue_id}|Получить venue|Гость|-|200: Venue object (incl. seat_map)|
|PUT|/venues/{venue_id}|Обновить venue|Organizer/Admin|Partial venue|200: Updated|
|DELETE|/venues/{venue_id}|Удалить venue|Admin|-|204|
|POST|/venues/{venue_id}/seats|Добавить seat|Organizer/Admin|`{ "sector": "string", "zone": "string", "row": "string", "number": "string" }`|201: Seat object|
|GET|/venues/{venue_id}/seats|Список seats в venue|Гость|Пагинация|200: Array of seats|
|GET|/seats/{seat_id}|Получить seat|Гость|-|200: Seat object|
|PUT|/seats/{seat_id}|Обновить seat|Organizer/Admin|Partial seat|200: Updated|
|DELETE|/seats/{seat_id}|Удалить seat|Admin|-|204|


### 4. События (/events)

Управление событиями (концерты, фильмы и т.д.).

|Метод|Путь|Описание|Аутентификация|Запрос|Ответ|
|---|---|---|---|---|---|
|POST|/events|Создать event|Organizer|`{ "venue_id": "UUID", "title": "string", "description": "text", "image_url": "string", "start_at": "timestamp", "end_at": "timestamp", "status": "string", "tags": ["array"] }`|201: Event object|
|GET|/events|Список событий (пагинация, фильтры)|Гость|Query: `venue_id`, `start_after`, `tags` (comma-separated), `status`, `search` (title/description)|200: `{ "events": [array], "total": int }`|
|GET|/events/{event_id}|Получить event|Гость|-|200: Event object (incl. venue, organizer)|
|PUT|/events/{event_id}|Обновить event|Organizer (владелец)|Partial event|200: Updated|
|DELETE|/events/{event_id}|Удалить event|Organizer/Admin|-|204|
|POST|/events/{event_id}/seat-instances|Инициализировать seat instances для event (из venue seats)|Organizer|- (автоматически создает на основе venue)|201: `{ "message": "Instances created", "count": int }`|
|GET|/events/{event_id}/seat-instances|Получить seat instances (доступность)|Гость|Query: `status` (available/reserved)|200: Array of seat instances|
|PUT|/seat-instances/{instance_id}|Обновить status seat instance|Organizer/Admin|`{ "status": "string" }`|200: Updated|


### 5. Бронирования (/bookings)

Управление бронированиями билетов.

| Метод  | Путь                         | Описание                               | Аутентификация          | Запрос                                                                                        | Ответ                                    |
| ------ | ---------------------------- | -------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| POST   | /bookings                    | Создать booking (резерв)               | Пользователь            | `{ "event_id": "UUID", "seat_instance_ids": ["array of UUID"], "idempotency_key": "string" }` | 201: Booking object (with expires_at)    |
| GET    | /bookings                    | Список своих bookings                  | Пользователь            | Пагинация, query: `status`, `event_id`                                                        | 200: Array of bookings                   |
| GET    | /bookings/{booking_id}       | Получить booking                       | Пользователь (владелец) | -                                                                                             | 200: Booking object (incl. items, event) |
| PUT    | /bookings/{booking_id}       | Обновить booking (e.g., extend expire) | Пользователь/Admin      | `{ "expires_at": "timestamp" }`                                                               | 200: Updated                             |
| DELETE | /bookings/{booking_id}       | Отменить booking                       | Пользователь/Admin      | -                                                                                             | 204                                      |
| POST   | /bookings/{booking_id}/items | Добавить item к booking                | Пользователь            | `{ "seat_instance_id": "UUID" }`                                                              | 201: Item object                         |
| DELETE | /booking-items/{item_id}     | Удалить item                           | Пользователь            | -                                                                                             | 204                                      |

### 6. Платежи (/payments)

Управление платежами (интеграция с провайдерами, e.g., Stripe/Yandex.Kassa).

|Метод|Путь|Описание|Аутентификация|Запрос|Ответ|
|---|---|---|---|---|---|
|POST|/payments|Инициировать платеж для booking|Пользователь|`{ "booking_id": "UUID", "provider": "string", "idempotency_key": "string" }`|201: `{ "payment_id": "UUID", "redirect_url": "string" (для оплаты) }`|
|GET|/payments/{payment_id}|Получить статус платежа|Пользователь/Admin|-|200: Payment object (status, transaction_id)|
|POST|/payments/webhook|Webhook от провайдера (обновление status)|Нет (secured by secret)|Provider-specific payload|200: `{ "message": "Processed" }`|
|PUT|/payments/{payment_id}|Обновить status (manual, для админа)|Admin|`{ "status": "string" }`|200: Updated|

