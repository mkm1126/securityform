/*
  # Add poc_user column for POC testing

  1. Changes
    - Add `poc_user` column to `security_role_requests` table
    - This column will store the test user identifier for POC testing
    - Allows multiple users to test simultaneously without data conflicts

  2. Security
    - Column is nullable to maintain compatibility with existing data
    - No additional RLS policies needed as existing policies cover this column
*/

-- Add poc_user column to security_role_requests table
ALTER TABLE security_role_requests 
ADD COLUMN IF NOT EXISTS poc_user text;

-- Add index for better query performance when filtering by poc_user
CREATE INDEX IF NOT EXISTS idx_security_role_requests_poc_user 
ON security_role_requests(poc_user);