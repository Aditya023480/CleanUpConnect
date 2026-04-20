# CleanUpConnect MVP

Community cleanup web app with event discovery, event creation, volunteer join flow, and beginner-friendly JWT authentication.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- Password hashing: bcrypt

## Backend File Structure
- `backend/app.js`
- `backend/db.js`
- `backend/routes/events.js`
- `backend/routes/auth.js`
- `backend/routes/leaderboard.js`
- `backend/middleware/authMiddleware.js`
- `backend/middleware/adminMiddleware.js`

## Setup Instructions

### Prerequisites
- Node.js installed
- PostgreSQL installed and running

### Database Setup
1. Create a PostgreSQL database named `community_cleaning`.
2. Run the SQL script:

   ```bash
   psql -U your_username -d postgres -f database/schema.sql
   ```

3. The schema creates:
- `events`
- `volunteers`
- `users`

4. For an existing database, run these migrations in pgAdmin or psql in order:

  - `database/migration_auth_event_ownership.sql`
  - `database/migration_points_admin.sql`

5. To make a user an admin, update the `users` table manually:

  ```sql
  UPDATE users SET role = 'admin' WHERE username = 'your_username';
  ```

6. Update database connection in `backend/db.js` only if you are not using `DATABASE_URL`.

### Local Environment Variables
1. Copy `backend/.env.example` to `backend/.env`.
2. Set:

  ```env
  PORT=5000
  JWT_SECRET=replace_with_a_long_random_secret
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/community_cleaning
  FRONTEND_URL=http://localhost:8000
  ```

### Environment Variables
1. In `backend`, create a `.env` file (or copy `backend/.env.example`).
2. Set at least:

   ```env
  PORT=5000
   JWT_SECRET=replace_with_a_long_random_secret
   ```

### Backend Setup
1. Go to backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start server:

   ```bash
   npm start
   ```

4. API base URL:
- `http://localhost:5000` locally
- `https://cleanupconnect-api.onrender.com` on Render

### Frontend Setup
1. Open `frontend/index.html` with a local web server.
2. Example:

   ```bash
   cd frontend
   python -m http.server 8000
   ```

3. Open `http://localhost:8000`.

### Deployment
#### Render backend
1. Connect the repo to Render.
2. Use `render.yaml` as the blueprint.
3. Render will create:
  - a web service named `cleanupconnect-api`
  - a PostgreSQL database named `cleanupconnect-db`
4. The backend reads `DATABASE_URL` automatically.

#### Vercel frontend
1. Deploy the `frontend` folder as the project root for the cleanest setup.
2. If you deploy the whole repo to Vercel, the root `index.html` redirects into the frontend app.
3. The frontend uses `frontend/api.js` to rewrite localhost API calls to the Render backend in production.
4. If you use a different backend URL, update `frontend/api.js` or set `localStorage.cleanupconnect_api_base_url`.

## PostgreSQL Schema (Auth)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Rank System
- Join an event: `+15` points
- Admin marks event complete: `+50` points for each volunteer and `+75` points for the organizer
- Rank tiers:
  - `Bronze`: 0-99 points
  - `Silver`: 100-249 points
  - `Gold`: 250-499 points
  - `Platinum`: 500+ points

## Authentication APIs

### Register
- `POST /register`
- Body:

  ```json
  {
    "username": "aditya",
    "email": "aditya@example.com",
    "password": "secret123"
  }
  ```

- Validations:
- Empty fields
- Email format
- Password length (min 6)
- Unique username/email

### Login
- `POST /login`
- Body:

  ```json
  {
    "identifier": "aditya@example.com",
    "password": "secret123"
  }
  ```

- Accepts email or username via `identifier`
- Returns JWT token + user info

### Protected Profile
- `GET /me`
- Header:

  ```
  Authorization: Bearer <token>
  ```

- Returns logged-in user info

### Leaderboard
- `GET /leaderboard`
- Returns all users ordered by points with rank position and rank tier

## Event APIs
- `GET /events`
- `GET /events/states`
- `GET /events/cities?state=<state>`
- `POST /events`
- `GET /events/:id`
- `DELETE /events/:id`
- `POST /events/:id/join`
- `POST /events/:id/complete` - Admin only
- `GET /events/:id/volunteers`

## Frontend Pages
- `frontend/index.html` - Event list + filters
- `frontend/create.html` - Create event
- `frontend/details.html` - Event details
- `frontend/register.html` - Register account
- `frontend/login.html` - Login
- `frontend/profile.html` - Protected profile page
- `frontend/leaderboard.html` - Public leaderboard

## Auth UX Flow
- Login stores JWT in localStorage
- Navbar updates based on auth state
- Logout clears token from localStorage
- Profile page calls `/me` with Bearer token
- Admins can mark events complete from the event details page
- Completing an event awards rank points automatically

## Security Basics Included
- Passwords stored as bcrypt hashes only
- Parameterized SQL queries
- JWT token expiry set to `7d`
- Generic auth error responses
