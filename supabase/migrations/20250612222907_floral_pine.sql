/*
  # Fix Duplicate Security Areas

  1. Changes
    - Remove duplicate security areas from existing data
    - Add unique constraint to prevent future duplicates
    - Update area-specific approval function to handle duplicates properly

  2. Security
    - Maintains existing RLS policies
*/

-- Remove duplicate security areas (keep only the most recent one for each request/area_type combination)
DELETE FROM security_areas 
WHERE id NOT IN (
  SELECT DISTINCT ON (request_id, area_type) id
  FROM security_areas
  ORDER BY request_id, area_type, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE security_areas 
ADD CONSTRAINT unique_request_area_type 
UNIQUE (request_id, area_type);

-- Update the area-specific approval function to handle duplicates properly
CREATE OR REPLACE FUNCTION create_area_specific_approvals()
RETURNS TRIGGER AS $$
DECLARE
  v_needs_accounting_approval boolean;
  v_needs_hr_approval boolean;
  v_request_areas text[];
BEGIN
  -- Get all security areas for this request
  SELECT array_agg(area_type)
  INTO v_request_areas
  FROM security_areas
  WHERE request_id = NEW.request_id;

  -- Check if accounting director approval is needed
  v_needs_accounting_approval := 
    array_position(v_request_areas, 'accounting_procurement') IS NOT NULL OR
    array_position(v_request_areas, 'hr_payroll') IS NOT NULL OR
    array_position(v_request_areas, 'epm_data_warehouse') IS NOT NULL;

  -- Check if HR director approval is needed
  v_needs_hr_approval :=
    array_position(v_request_areas, 'hr_payroll') IS NOT NULL OR
    array_position(v_request_areas, 'epm_data_warehouse') IS NOT NULL;

  -- Add Accounting Director approval if needed (third in order)
  IF v_needs_accounting_approval AND NEW.area_type = 'accounting_procurement' THEN
    INSERT INTO request_approvals (
      request_id,
      step,
      approver_email
    )
    VALUES (
      NEW.request_id,
      'accounting_director_approval',
      NEW.director_email
    )
    ON CONFLICT (request_id, step) DO UPDATE SET
      approver_email = EXCLUDED.approver_email;
  END IF;

  -- Add HR Director approval if needed (fourth in order)
  IF v_needs_hr_approval AND NEW.area_type = 'hr_payroll' THEN
    INSERT INTO request_approvals (
      request_id,
      step,
      approver_email
    )
    VALUES (
      NEW.request_id,
      'hr_director_approval',
      NEW.director_email
    )
    ON CONFLICT (request_id, step) DO UPDATE SET
      approver_email = EXCLUDED.approver_email;
  END IF;

  -- Add ELM admin approval if needed (fifth in order)
  IF NEW.area_type = 'elm' THEN
    INSERT INTO request_approvals (
      request_id,
      step,
      approver_email
    )
    VALUES (
      NEW.request_id,
      'elm_admin_approval',
      NEW.director_email
    )
    ON CONFLICT (request_id, step) DO UPDATE SET
      approver_email = EXCLUDED.approver_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;