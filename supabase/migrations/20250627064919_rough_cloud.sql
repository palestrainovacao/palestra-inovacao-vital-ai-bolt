/*
  # Remove schedules table

  1. Changes
    - Drop the schedules table as it's no longer needed
    - This will cascade delete all data in the table
    - The schedules functionality is being removed from the application
*/

-- Drop the schedules table if it exists
DROP TABLE IF EXISTS schedules;
