BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_by INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_completed_by_fkey'
  ) THEN
    ALTER TABLE events
    ADD CONSTRAINT events_completed_by_fkey
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';
UPDATE users SET points = 0 WHERE points IS NULL;

COMMIT;
