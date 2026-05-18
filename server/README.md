# JustFundz Backend

## Setup

1) Copy the environment file and update values:

```
cp .env.example .env
```

2) Install dependencies:

```
npm install
```

3) Create the database and run the schema:

```
psql $DATABASE_URL -f schema.sql
```

4) Start the server:

```
npm run dev
```

## API Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/reset`
- `POST /api/auth/reset/confirm`
- `GET /api/me`

## Notes

- Sessions are stored in Postgres via `connect-pg-simple`.
- Passwords are hashed with bcrypt.
- SMTP credentials are required for verification and reset emails.
