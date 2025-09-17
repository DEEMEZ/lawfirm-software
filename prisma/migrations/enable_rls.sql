-- Enable Row Level Security on all tenant-scoped tables
-- This file should be run after the initial Prisma migration

-- Enable RLS on tenant-scoped tables
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for law_firms table
-- Super admins can see all firms, others can only see their own
CREATE POLICY law_firms_select_policy ON law_firms
  FOR SELECT
  USING (
    current_setting('app.current_user_role', true) = 'super_admin' OR
    id = current_setting('app.current_law_firm_id', true)::text
  );

CREATE POLICY law_firms_insert_policy ON law_firms
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_user_role', true) = 'super_admin'
  );

CREATE POLICY law_firms_update_policy ON law_firms
  FOR UPDATE
  USING (
    current_setting('app.current_user_role', true) = 'super_admin' OR
    id = current_setting('app.current_law_firm_id', true)::text
  );

-- Create policies for users table
CREATE POLICY users_tenant_policy ON users
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create policies for roles table
CREATE POLICY roles_tenant_policy ON roles
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create policies for user_roles table
CREATE POLICY user_roles_tenant_policy ON user_roles
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create policies for clients table
CREATE POLICY clients_tenant_policy ON clients
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create policies for cases table
CREATE POLICY cases_tenant_policy ON cases
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create policies for documents table
CREATE POLICY documents_tenant_policy ON documents
  FOR ALL
  USING (law_firm_id = current_setting('app.current_law_firm_id', true)::text);

-- Create a function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_law_firm_id text,
  p_user_role text DEFAULT 'user'
)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_law_firm_id', p_law_firm_id, false);
  PERFORM set_config('app.current_user_role', p_user_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_law_firm_id', '', false);
  PERFORM set_config('app.current_user_role', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;