/*
  # Add notification status fields

  1. Table Updates
    - Add `family_notified` column to track if family has been notified
    - Add `resolved` column to track if the notification has been resolved
    - Add indexes for these new columns for better query performance

  2. Security
    - The columns inherit the same RLS policies from the notifications table
*/

-- Add family_notified column to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'family_notified'
  ) THEN
    ALTER TABLE notifications ADD COLUMN family_notified boolean DEFAULT false;
  END IF;
END $$;

-- Add resolved column to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'resolved'
  ) THEN
    ALTER TABLE notifications ADD COLUMN resolved boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_notifications_family_notified ON notifications(family_notified);
CREATE INDEX IF NOT EXISTS idx_notifications_resolved ON notifications(resolved);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_resolved ON notifications(user_id, resolved);
CREATE INDEX IF NOT EXISTS idx_notifications_user_family_notified ON notifications(user_id, family_notified);
