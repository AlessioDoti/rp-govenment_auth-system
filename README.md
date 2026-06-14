# rp-auth-system

Auth microservice for the RP Government System. Implements OAuth2 password grant, refresh token rotation, user registration, role management, and JWT-based session handling.

Built as a hexagonal (ports & adapters) Node.js + Express application in pure JavaScript. MySQL is the only data store.

## Dependencies

- **MySQL 8.0** — no other microservice is required to run in isolation.
- The service shares `JWT_SECRET` with `rp-burocracy-system-js` and `rp-govenment_person-system` so they can verify tokens issued here.

## Run without Docker

Prerequisito: **MySQL 8.0** in esecuzione (locale o via Docker).

### 1. Preparare il database

Se si usa Docker solo per MySQL:

```sh
cd db
docker compose -f mysql-auth.yml up -d
```

In alternativa, creare manualmente il database `auth` ed eseguire `db/init/01_init.sql` su un'istanza MySQL locale.

### 2. Avviare l'app

```sh
cp .env.example .env
# Modificare .env con i valori corretti per DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
npm install
npm run dev       # node --watch (hot reload)
# oppure
npm start         # produzione
```

Il servizio ascolta sulla porta configurata (`PORT`, default `8083`).

### 3. Test

```sh
curl -s http://localhost:8083/health
```

## Run with Docker

### Singolo servizio (app + MySQL)

```sh
# Build e avvio
docker compose -f db/mysql-auth.yml up -d
docker build -t rp-auth .
docker run -d -p 8083:8083 --network host rp-auth
```

### Ecosistema completo

```sh
# Dalla root del progetto (rp-government-system/)
docker compose up -d
```

## API

### Authentication

| Method | Path                  | Body                                              | Response          |
| ------ | --------------------- | ------------------------------------------------- | ----------------- |
| POST   | `/auth/token`         | `{ grant_type: "password", username, password }`  | Token response    |
| POST   | `/auth/token`         | `{ grant_type: "refresh_token", refresh_token }`  | Token response    |
| POST   | `/auth/register`      | `{ username, email, password }`                   | UserDTO           |
| POST   | `/auth/revoke`        | `{ refresh_token }`                               | `200 OK`          |
| GET    | `/auth/userinfo`      | — (Bearer token)                                  | UserInfoDTO       |

### Admin

| Method | Path                       | Auth     | Response          |
| ------ | -------------------------- | -------- | ----------------- |
| GET    | `/auth/users`              | ADMIN    | UserDTO[]         |
| PATCH  | `/auth/users/:uuid/roles`  | ADMIN    | UserDTO           |

### Health

`GET /health` → `{ status: 'ok', db: 'up' }` (or `503` if MySQL is down).

## Configuration

| Variable                    | Default     | Description                               |
| --------------------------- | ----------- | ----------------------------------------- |
| `NODE_ENV`                  | development | `development` / `test` / `production`     |
| `PORT`                      | 8083        | HTTP port                                 |
| `DB_HOST`                   | —           | MySQL host                                |
| `DB_PORT`                   | 3306        | MySQL port                                |
| `DB_USER`                   | —           | MySQL user                                |
| `DB_PASSWORD`               | —           | MySQL password                            |
| `DB_NAME`                   | auth        | Database name                             |
| `DB_CONNECTION_LIMIT`       | 10          | Pool size                                 |
| `LOG_LEVEL`                 | info        | Pino level                                |
| `JWT_SECRET`                | —           | HMAC key for JWT signing                  |
| `JWT_ISSUER`                | —           | JWT `iss` claim                           |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | 900       | Access token TTL (seconds)                |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | 2592000  | Refresh token TTL (seconds)               |

## Tests

No external dependencies required (in-memory DI container).

```sh
npm test
```
