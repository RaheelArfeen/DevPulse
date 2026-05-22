# DevPulse

DevPulse is a small backend API for tracking bugs and feature requests inside a team. People sign up, file an issue, and a maintainer moves it through a small workflow (open, in_progress, resolved).

Built as my Express + TypeScript + Postgres assignment.

## Live URL

Add your deployed URL here once it is live.

## What it does

- Sign up and log in using JWT.
- Two kinds of users: contributor (default) and maintainer.
- Anyone can list and read issues. Logged in users can create one.
- Contributors can edit their own issue while it is still open.
- Maintainers can edit anything on any issue, change its status, and delete it.

## Tech I used

- Node.js with TypeScript
- Express for routing
- PostgreSQL through the raw `pg` driver (no ORM, no SQL JOINs)
- `bcryptjs` for hashing passwords
- `jsonwebtoken` for the tokens
- `http-status-codes` so I do not have to remember the numbers

## Folder layout

```
DevPulse/
  api/                  Vercel entry point
  src/
    app.ts              Express app, middleware, routes mounted here
    server.ts           Local entry point, calls app.listen
    config/             Reads .env values
    db/                 The pg pool and the CREATE TABLE on boot
    middleware/         auth, error handler, 404, request type
    utility/            sendResponse helper used by every controller
    types/              Shared role, type and status constants
    modules/
      auth/             signup and login
      issue/            CRUD for issues
  vercel.json           Tells Vercel how to route requests
```

## Database tables

`users`
- id, name, email (unique), password (hashed), role (contributor or maintainer), created_at, updated_at

`issues`
- id, title (max 150), description (min 20 chars), type (bug or feature_request), status (open, in_progress, resolved, default open), reporter_id, created_at, updated_at
- No foreign key on reporter_id, I validate it in the code.

## API endpoints

| Method | Path | Who can call it |
| --- | --- | --- |
| POST | /api/auth/signup | Anyone |
| POST | /api/auth/login | Anyone |
| POST | /api/issues | Any logged in user |
| GET | /api/issues | Anyone (supports ?sort, ?type, ?status) |
| GET | /api/issues/:id | Anyone |
| PATCH | /api/issues/:id | Maintainer on any issue, contributor on their own open one |
| DELETE | /api/issues/:id | Maintainer only |

Query params on `GET /api/issues`:
- `sort=newest` (default) or `sort=oldest`
- `type=bug` or `type=feature_request`
- `status=open`, `status=in_progress` or `status=resolved`

The Authorization header is just the raw JWT token, no "Bearer " prefix.

## Environment variables

Create a `.env` file in the project root:

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DBNAME?sslmode=require
JWT_SECRET=put_a_long_random_string_here
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

To generate a strong `JWT_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

You can get a free Postgres URL from Neon, Supabase or ElephantSQL.

## Running it locally

```
npm install
npm run dev
```

The first time it boots it creates the two tables for you. The port defaults to 5000 unless you set one in `.env`.

## Deploying to Vercel

1. Push the code to a public GitHub repo (with `.env` ignored).
2. Go to vercel.com and import the repo.
3. In the project settings, open Environment Variables and add everything from your `.env`. Set `NODE_ENV` to `production`.
4. Click Deploy. The `vercel.json` and `api/index.ts` already in this project tell Vercel to send every request through the Express app.

## Notes on how it is built

- Every SQL query uses parameters (`$1`, `$2`, ...) so SQL injection is not a concern.
- The reporter info on an issue is attached without a JOIN. I fetch the issues first, then run one extra query with `WHERE id IN (...)` to get the users.
- The auth middleware re-reads the user from the database on every protected request, so if a role changes the next request reflects it.
- The sort direction is hardcoded to `ASC` or `DESC`, never built from user input.
- Passwords are hashed with bcrypt and stripped from every response before sending.
