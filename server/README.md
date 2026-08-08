# Backend Starter

Express + TypeScript authentication starter with PostgreSQL, Drizzle ORM, JWT session handling, request validation, structured logging, and email verification / password reset flows.

## Features

- Express 5 API written in TypeScript
- PostgreSQL access through Drizzle ORM
- JWT access and refresh token authentication
- Cookie-based refresh token storage
- Zod request validation
- Centralized error handling and HTTP logging
- Email verification and password reset flows through Ethereal test mail

## Requirements

- Node.js 24 or newer
- A PostgreSQL database
- npm

## Getting Started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root.

   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/backend_template
   JWT_ACCESS_SECRET=replace-with-a-long-random-string
   JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
   NODE_ENV=development
   ```

3. Run the database migrations.

   ```bash
   npx drizzle-kit migrate
   ```

4. Start the development server.

   ```bash
   npm run dev
   ```

The server only starts after it successfully connects to the database.

## Available Scripts

- `npm run dev` - start the API in watch mode with `tsx`
- `npm run build` - compile TypeScript to `dist/`
- `npm start` - run the compiled server from `dist/index.js`
- `npm run type-check` - run TypeScript without emitting files

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port for the server. Defaults to `3000`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Drizzle and `pg`. |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens. |
| `NODE_ENV` | Yes | Runtime environment flag used by logging and error handling. |

## API Overview

Base path: `/api/auth`

- `POST /register` - create a new user
- `POST /login` - authenticate and receive an access token
- `POST /refresh` - exchange a refresh token cookie for a new access token
- `POST /logout` - invalidate the current session
- `GET /profile` - fetch the authenticated user profile
- `GET /verify-email/:token` - verify a user email address
- `POST /forgot-password` - request a password reset email
- `POST /reset-password/:token` - set a new password using a reset token

Additional health checks:

- `GET /` - basic welcome response
- `GET /health` - server health response

## Database

Drizzle is configured in `drizzle.config.ts` to use `src/db/schema.ts` and write migrations to `src/db/migrations/`.

Common Drizzle commands:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Project Structure

- `src/index.ts` - application entry point
- `src/config/env.ts` - environment validation
- `src/routes/` - route definitions
- `src/controllers/` - request handlers
- `src/services/` - business logic and integrations
- `src/db/` - database connection, schema, and migrations
- `src/middlewares/` - validation, auth, logging, and error handling
- `src/utils/` - logger and shared helpers

## Notes

- Email delivery uses Ethereal test accounts for local development.
- The refresh token is stored in an HTTP-only cookie named `refreshToken`.
- If you change the schema, regenerate and apply migrations before restarting the server.
