/*
  # Add ELM Role Selection Fields

  1. Changes
    - Add comprehensive ELM role selection fields to security_role_selections table
    - Add fields for all ELM administrative functions as seen in the PDF

  2. New Fields
    - ELM Administrative Roles
    - Course Management permissions
    - User Management permissions  
    - Reporting and Analytics permissions
    - Learning Path Management permissions
    - Certification Management permissions
    - System Configuration permissions
    - Additional Permissions
    - Role justification field
*/

-- Add ELM role selection fields to security_role_selections table
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS elm_system_administrator boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS elm_key_administrator boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS elm_course_administrator boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS elm_reporting_administrator boolean DEFAULT false;

-- Course Management
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS create_courses boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS edit_courses boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS delete_courses boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS manage_course_content boolean DEFAULT false;

-- User Management
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS manage_user_accounts boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS assign_user_roles boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS view_user_progress boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS generate_user_reports boolean DEFAULT false;

-- Reporting and Analytics
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS access_system_reports boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS create_custom_reports boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS export_report_data boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS view_analytics_dashboard boolean DEFAULT false;

-- Learning Path Management
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS create_learning_paths boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS edit_learning_paths boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS assign_learning_paths boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS track_learning_progress boolean DEFAULT false;

-- Certification Management
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS manage_certifications boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS issue_certificates boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS track_certification_status boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS renew_certifications boolean DEFAULT false;

-- System Configuration
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS configure_system_settings boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS manage_integrations boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS setup_notifications boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS manage_security_settings boolean DEFAULT false;

-- Additional Permissions
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS bulk_user_operations boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS data_import_export boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS system_backup_access boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS audit_log_access boolean DEFAULT false;

-- Role justification
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS role_justification text;

-- Create index for better query performance on ELM-related fields
CREATE INDEX IF NOT EXISTS idx_security_role_selections_elm_roles 
ON security_role_selections(elm_system_administrator, elm_key_administrator, elm_course_administrator, elm_reporting_administrator);