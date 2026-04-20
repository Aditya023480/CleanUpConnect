-- Run this on an existing database to move from anonymous events/joins to authenticated ownership.

-- 1) Ensure users table exists.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) Add organizer_id to events if missing.
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organizer_id INT REFERENCES users(id) ON DELETE CASCADE;

-- 3) Replace nickname-based volunteers with user-based volunteers.
-- WARNING: Existing anonymous volunteer nicknames will be removed.
ALTER TABLE volunteers
DROP COLUMN IF EXISTS nickname;

ALTER TABLE volunteers
ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;

-- 4) Remove rows that cannot map to a user and enforce constraints.
DELETE FROM volunteers WHERE user_id IS NULL;

ALTER TABLE volunteers
ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volunteers_event_user_unique'
  ) THEN
    ALTER TABLE volunteers
    ADD CONSTRAINT volunteers_event_user_unique UNIQUE (event_id, user_id);
  END IF;
END $$;
