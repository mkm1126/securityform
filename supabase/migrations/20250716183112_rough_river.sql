/*
  # Add completion tracking to security role requests

  1. Changes
    - Add `completed_by` column to track who completed the request
    - Add `completed_at` column to track when the request was completed

  2. Security
    - No RLS changes needed as existing policies will cover new columns
*/

-- Add completion tracking columns to security_role_requests table
ALTER TABLE security_role_requests 
ADD COLUMN IF NOT EXISTS completed_by text,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;