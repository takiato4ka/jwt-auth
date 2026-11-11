# JWT Auth

Полноценная система аутентификации на **JWT** с access/refresh токенами, активацией аккаунта по email и автоматическим обновлением сессии на клиенте.

**Стек:** Node.js · Express · MongoDB (Mongoose) · React · TypeScript · MobX · Axios

## Возможности

- Регистрация и вход по email + паролю (пароли хешируются через `bcrypt`)
- Пара токенов: короткоживущий **access** (15 минут) и долгоживущий **refresh** (30 дней)
- Refresh-токен хранится в `httpOnly` cookie и сохраняется в БД, при выходе — удаляется
- Активация аккаунта по ссылке из письма (Nodemailer, SMTP)
- Защищённые маршруты через middleware с проверкой access-токена
- Валидация входных данных (`express-validator`)
- Единый обработчик ошибок (`ApiError`)
- Клиент: Axios-интерцептор, который при `401` сам запрашивает новую пару токенов и повторяет запрос
- Глобальное состояние авторизации на MobX

## Структура проекта

```
jwt-auth/
├── client/                # React + TypeScript (Create React App)
│   └── src/
│       ├── components/    # LoginForm
│       ├── http/          # Axios-инстанс с интерцепторами
│       ├── models/        # Типы (IUser, AuthResponse)
│       ├── services/      # AuthService, UserService
│       └── store/         # MobX store
└── server/                # Express API
    ├── controllers/
    ├── dtos/
    ├── exceptions/
    ├── middlewares/       # auth-middleware, error-middleware
    ├── models/            # User, Token
    ├── router/
    └── service/           # user, token, mail
```

## Быстрый старт

### Требования

- Node.js 18+
- MongoDB (локально или [MongoDB Atlas](https://www.mongodb.com/atlas))
- SMTP-аккаунт для отправки писем (например, Gmail с [паролем приложения](https://support.google.com/accounts/answer/185833))

### 1. Клонирование

```bash
git clone https://github.com/<your-username>/jwt-auth.git
cd jwt-auth
```

### 2. Сервер

```bash
cd server
npm install
cp .env.example .env     # затем заполни значения
npm run dev
```

Сервер запустится на `http://localhost:5000`.

### 3. Клиент

```bash
cd client
npm install
npm start
```

Клиент откроется на `http://localhost:3000`.

## Переменные окружения

Файл `server/.env`:

| Переменная           | Описание                                         |
| -------------------- | ------------------------------------------------ |
| `PORT`               | Порт сервера (по умолчанию `5000`)               |
| `MONGODB_URI`        | Строка подключения к MongoDB                     |
| `JWT_ACCESS_SECRET`  | Секрет для подписи access-токенов                |
| `JWT_REFRESH_SECRET` | Секрет для подписи refresh-токенов               |
| `SMTP_HOST`          | SMTP-сервер (например, `smtp.gmail.com`)         |
| `SMTP_PORT`          | SMTP-порт (например, `587`)                      |
| `SMTP_USER`          | Email, с которого уходят письма                  |
| `SMTP_PASSWORD`      | Пароль / пароль приложения                       |
| `API_URL`            | URL сервера (для ссылки активации)               |
| `CLIENT_URL`         | URL клиента (для CORS)                           |

> Секреты должны быть длинными и случайными. Сгенерировать можно так:
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## API

Базовый путь: `/api`

| Метод  | Маршрут              | Описание                                   | Доступ     |
| ------ | -------------------- | ------------------------------------------ | ---------- |
| `POST` | `/registration`      | Регистрация, отправка письма активации     | публичный  |
| `POST` | `/login`             | Вход, выдача access + refresh              | публичный  |
| `POST` | `/logout`            | Выход, удаление refresh-токена             | публичный  |
| `GET`  | `/activation/:link`  | Активация аккаунта по ссылке из письма     | публичный  |
| `GET`  | `/refresh`           | Обновление пары токенов по refresh-cookie  | публичный  |
| `GET`  | `/users`             | Список пользователей                       | access JWT |

Для защищённых маршрутов передавай заголовок `Authorization: Bearer <accessToken>`.

## Как это работает

1. При входе сервер выдаёт **access**-токен (в теле ответа) и **refresh**-токен (в `httpOnly` cookie).
2. Клиент добавляет access-токен к каждому запросу.
3. Когда access истекает, сервер отвечает `401`, интерцептор вызывает `/refresh`, получает новую пару токенов и повторяет исходный запрос — пользователь ничего не замечает.
4. Если refresh невалиден или отсутствует в БД — пользователь разлогинивается.

## Планы по улучшению

- [ ] Вынести `API_URL` на клиенте в `.env`
- [ ] Хранить access-токен в памяти вместо `localStorage`
- [ ] Rate limiting на `/login` и `/registration`
- [ ] Страница списка пользователей и отображение статуса активации

## Лицензия

[MIT](LICENSE)
