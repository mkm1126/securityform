/*
  # Add UPDATE policy for security_role_selections table

  1. Security Policy Changes
    - Add UPDATE policy for `security_role_selections` table to allow public role to update records
    - This enables the upsert operation used in the ELM role selection form

  2. Notes
    - This maintains consistency with existing INSERT and SELECT policies
    - Allows the frontend to update existing role selections when users modify their choices
*/

-- Add UPDATE policy for security_role_selections table
CREATE POLICY "Allow public to update security role selections"
  ON security_role_selections
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);