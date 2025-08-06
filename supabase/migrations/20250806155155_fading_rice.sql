/*
  # Add comments field to request_approvals table

  1. Changes
    - Add `comments` column to `request_approvals` table to store additional comments from approvers
    - Column is optional (nullable) and stores text data

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
*/

-- Add comments column to request_approvals table
ALTER TABLE request_approvals 
ADD COLUMN IF NOT EXISTS comments text;