-- Migration: Enhanced Authentication & Access Control
-- COPPA/FERPA compliance, parental consent, tutor verification, audit logging, SSO

-- =============================================================================
-- PARENTAL CONSENT (COPPA/FERPA Compliance)
-- =============================================================================

-- Consent types
CREATE TYPE consent_type AS ENUM (
  'account_creation',      -- Consent to create student account
  'data_collection',       -- Consent to collect student data
  'photo_video',           -- Consent for photos/videos
  'marketing',             -- Consent for marketing communications
  'third_party_sharing',   -- Consent to share with integrations
  'competition_participation', -- Consent for competitions
  'field_trip',            -- Consent for in-person events
  'medical_treatment'      -- Emergency medical consent
);

CREATE TYPE consent_status AS ENUM (
  'pending',
  'granted',
  'denied',
  'revoked',
  'expired'
);

-- Parental consent records
CREATE TABLE IF NOT EXISTS parental_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is consenting for whom
  student_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users_profile(id),
  family_id UUID REFERENCES families(id),

  -- Consent details
  consent_type consent_type NOT NULL,
  status consent_status DEFAULT 'pending',

  -- Legal information
  student_age_at_consent INT,
  is_coppa_applicable BOOLEAN DEFAULT FALSE, -- Under 13
  is_ferpa_applicable BOOLEAN DEFAULT FALSE, -- Educational records

  -- Consent document
  consent_version VARCHAR(20) NOT NULL, -- e.g., "2024.1"
  consent_text_hash VARCHAR(64), -- SHA-256 of consent text shown
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Some consents may need renewal
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Signature (for legal compliance)
  signature_data JSONB, -- Could include e-signature, checkbox confirmations

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_user_id, consent_type, consent_version)
);

-- Consent templates (what users see)
CREATE TABLE IF NOT EXISTS consent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_type consent_type NOT NULL,
  version VARCHAR(20) NOT NULL,

  title VARCHAR(255) NOT NULL,
  summary TEXT, -- Plain language summary
  full_text TEXT NOT NULL, -- Legal text

  -- Requirements
  requires_signature BOOLEAN DEFAULT FALSE,
  requires_checkbox BOOLEAN DEFAULT TRUE,
  min_age_without_parent INT DEFAULT 18,

  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE NOT NULL,
  expiry_days INT, -- How long consent is valid (NULL = forever)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(consent_type, version)
);

-- =============================================================================
-- PARENT-CHILD ACCOUNT LINKING
-- =============================================================================

-- Enhanced permissions for parent-child relationships
CREATE TYPE parent_permission AS ENUM (
  'view_profile',
  'edit_profile',
  'view_progress',
  'view_sessions',
  'book_sessions',
  'cancel_sessions',
  'view_messages',
  'send_messages',
  'manage_homework',
  'view_reports',
  'manage_integrations',
  'manage_payments'
);

-- Parent-child permission matrix
CREATE TABLE IF NOT EXISTS parent_child_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Permissions (array allows flexible permission sets)
  permissions parent_permission[] DEFAULT ARRAY[
    'view_profile', 'view_progress', 'view_sessions',
    'book_sessions', 'view_reports'
  ]::parent_permission[],

  -- Relationship type
  relationship VARCHAR(50) DEFAULT 'parent', -- 'parent', 'guardian', 'authorized_adult'
  is_primary_guardian BOOLEAN DEFAULT FALSE,

  -- Access restrictions
  can_login_as_student BOOLEAN DEFAULT FALSE, -- For younger children
  requires_student_approval BOOLEAN DEFAULT FALSE, -- For older teens

  -- Validity
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users_profile(id),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(parent_user_id, student_user_id)
);

-- Student age tracking (for permission logic)
ALTER TABLE students_profile
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS age_verified_by UUID REFERENCES users_profile(id);

-- =============================================================================
-- TUTOR VERIFICATION PIPELINE
-- =============================================================================

CREATE TYPE verification_status AS ENUM (
  'not_started',
  'pending',
  'in_review',
  'approved',
  'rejected',
  'expired',
  'suspended'
);

CREATE TYPE verification_type AS ENUM (
  'identity',           -- Government ID verification
  'background_check',   -- Criminal background check
  'education',          -- Degree/credential verification
  'certification',      -- Teaching certifications
  'reference',          -- Professional references
  'interview',          -- Interview completed
  'demo_lesson',        -- Demo lesson evaluation
  'training'            -- Platform training completed
);

-- Tutor verification records
CREATE TABLE IF NOT EXISTS tutor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,

  verification_type verification_type NOT NULL,
  status verification_status DEFAULT 'not_started',

  -- Verification details
  provider VARCHAR(100), -- e.g., 'Checkr', 'Sterling', 'manual'
  external_id VARCHAR(255), -- ID from verification provider

  -- Documents
  document_urls TEXT[],
  document_names TEXT[],

  -- Results
  result_data JSONB, -- Provider-specific result data
  passed BOOLEAN,
  score INT, -- For scored verifications (demo lesson, interview)

  -- Review
  reviewed_by UUID REFERENCES users_profile(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Validity
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tutor_user_id, verification_type)
);

-- Overall tutor verification status
ALTER TABLE tutors_profile
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_teach_minors BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS background_check_clear BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS background_check_date DATE,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credentials_verified BOOLEAN DEFAULT FALSE;

-- Tutor certifications
CREATE TABLE IF NOT EXISTS tutor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  credential_id VARCHAR(255),

  issue_date DATE,
  expiry_date DATE,

  document_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users_profile(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGGING
-- =============================================================================

CREATE TYPE audit_action AS ENUM (
  -- Authentication
  'login',
  'logout',
  'login_failed',
  'password_change',
  'password_reset',
  'mfa_enabled',
  'mfa_disabled',

  -- Data access
  'view',
  'create',
  'update',
  'delete',
  'export',
  'import',

  -- Sensitive actions
  'consent_granted',
  'consent_revoked',
  'permission_changed',
  'role_changed',

  -- Admin actions
  'impersonate_start',
  'impersonate_end',
  'user_suspended',
  'user_activated',

  -- Financial
  'payment_initiated',
  'refund_issued'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  actor_user_id UUID REFERENCES users_profile(id), -- NULL for system actions
  actor_role VARCHAR(50),
  impersonator_user_id UUID REFERENCES users_profile(id), -- If acting as another user

  -- What
  action audit_action NOT NULL,
  resource_type VARCHAR(100) NOT NULL, -- 'student', 'booking', 'session', etc.
  resource_id UUID,

  -- Details
  description TEXT,
  old_values JSONB, -- Previous state for updates
  new_values JSONB, -- New state for updates/creates
  metadata JSONB, -- Additional context

  -- Where
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100), -- Correlation ID

  -- When
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Compliance
  is_sensitive BOOLEAN DEFAULT FALSE, -- PII/PHI access
  data_categories TEXT[], -- e.g., ['pii', 'educational_record', 'financial']
  retention_days INT DEFAULT 2555 -- 7 years default for compliance
);

-- Partition audit logs by month for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- =============================================================================
-- SCHOOL SSO (Organizations & Single Sign-On)
-- =============================================================================

CREATE TYPE organization_type AS ENUM (
  'school',
  'district',
  'tutoring_center',
  'homeschool_coop',
  'nonprofit',
  'corporate'
);

CREATE TYPE sso_provider AS ENUM (
  'google_workspace',
  'microsoft_entra',  -- Azure AD
  'clever',
  'classlink',
  'saml',
  'oidc'
);

-- Organizations (schools, districts, etc.)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type organization_type NOT NULL,

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',

  -- SSO Configuration
  sso_enabled BOOLEAN DEFAULT FALSE,
  sso_provider sso_provider,
  sso_config JSONB, -- Provider-specific configuration
  sso_domain VARCHAR(255), -- e.g., 'school.edu' for email domain matching
  sso_auto_provision BOOLEAN DEFAULT FALSE, -- Auto-create accounts on first login

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7),

  -- Billing
  billing_email VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  subscription_tier VARCHAR(50), -- 'free', 'basic', 'premium', 'enterprise'

  -- Limits
  max_students INT,
  max_tutors INT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  onboarded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,

  -- Role within organization
  org_role VARCHAR(50) DEFAULT 'member', -- 'admin', 'teacher', 'student', 'parent', 'member'

  -- External IDs (from SSO)
  external_id VARCHAR(255), -- User ID in external system
  external_email VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users_profile(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- SSO sessions (track SSO-initiated sessions)
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  provider sso_provider NOT NULL,
  external_session_id VARCHAR(255),

  -- Tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Session info
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  ip_address INET,
  user_agent TEXT
);

-- =============================================================================
-- ADMIN IMPERSONATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  admin_user_id UUID NOT NULL REFERENCES users_profile(id),
  target_user_id UUID NOT NULL REFERENCES users_profile(id),

  reason TEXT NOT NULL, -- Required justification
  ticket_id VARCHAR(100), -- Support ticket reference

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- What was accessed
  pages_visited TEXT[],
  actions_taken JSONB,

  ip_address INET,
  user_agent TEXT
);

-- =============================================================================
-- FINE-GRAINED PERMISSIONS
-- =============================================================================

-- Permission definitions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'students.view', 'reports.export'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'students', 'reports', 'billing', etc.

  -- Default role assignments
  default_for_roles VARCHAR(50)[], -- ['admin', 'tutor']

  is_sensitive BOOLEAN DEFAULT FALSE,
  requires_audit BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom role definitions (beyond basic roles)
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,
  description TEXT,

  organization_id UUID REFERENCES organizations(id), -- NULL for system-wide roles

  permissions TEXT[], -- Array of permission codes

  is_system BOOLEAN DEFAULT FALSE, -- System-defined vs custom
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),

  UNIQUE(name, organization_id)
);

-- User custom role assignments
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,

  organization_id UUID REFERENCES organizations(id),

  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users_profile(id),
  expires_at TIMESTAMPTZ,

  UNIQUE(user_id, role_id, organization_id)
);

-- =============================================================================
-- API KEYS
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Key (store hash, not plain text)
  key_prefix VARCHAR(8) NOT NULL, -- First 8 chars for identification
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash

  -- Permissions
  scopes TEXT[], -- e.g., ['read:students', 'write:bookings']

  -- Limits
  rate_limit_per_minute INT DEFAULT 60,
  allowed_ips INET[],

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  usage_count INT DEFAULT 0,

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_parental_consents_student ON parental_consents(student_user_id);
CREATE INDEX IF NOT EXISTS idx_parental_consents_parent ON parental_consents(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parental_consents_status ON parental_consents(status);
CREATE INDEX IF NOT EXISTS idx_parent_child_perms_parent ON parent_child_permissions(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_perms_student ON parent_child_permissions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_verifications_tutor ON tutor_verifications(tutor_user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_verifications_status ON tutor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Parents can see consents for their children
CREATE POLICY consents_parent_access ON parental_consents
  FOR SELECT USING (parent_user_id = auth.uid());

-- Students can see their own consents (if old enough)
CREATE POLICY consents_student_access ON parental_consents
  FOR SELECT USING (
    student_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM students_profile sp
      WHERE sp.user_id = auth.uid()
      AND sp.date_of_birth <= CURRENT_DATE - INTERVAL '13 years'
    )
  );

-- Admins can see all consents
CREATE POLICY consents_admin_access ON parental_consents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Consent templates are public read
CREATE POLICY consent_templates_read ON consent_templates
  FOR SELECT USING (is_active = TRUE);

-- Tutors can see their own verification status
CREATE POLICY tutor_verifications_self ON tutor_verifications
  FOR SELECT USING (tutor_user_id = auth.uid());

-- Admins can manage verifications
CREATE POLICY tutor_verifications_admin ON tutor_verifications
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Audit logs: only admins can read
CREATE POLICY audit_logs_admin ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
  ));

-- Organizations visible to members
CREATE POLICY organizations_member_access ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
  );

-- API keys: users see their own
CREATE POLICY api_keys_owner ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_code TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR(50);
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Get user's base role
  SELECT role INTO v_user_role FROM users_profile WHERE id = p_user_id;

  -- Admins have all permissions
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check custom role assignments
  SELECT TRUE INTO v_has_permission
  FROM user_role_assignments ura
  JOIN custom_roles cr ON cr.id = ura.role_id
  WHERE ura.user_id = p_user_id
    AND p_permission_code = ANY(cr.permissions)
    AND (ura.expires_at IS NULL OR ura.expires_at > NOW());

  IF v_has_permission THEN
    RETURN TRUE;
  END IF;

  -- Check default permissions for role
  SELECT TRUE INTO v_has_permission
  FROM permissions
  WHERE code = p_permission_code
    AND v_user_role = ANY(default_for_roles);

  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_user_id UUID,
  p_action audit_action,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_is_sensitive BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_actor_role VARCHAR(50);
BEGIN
  SELECT role INTO v_actor_role FROM users_profile WHERE id = p_actor_user_id;

  INSERT INTO audit_logs (
    actor_user_id, actor_role, action, resource_type, resource_id,
    description, old_values, new_values, metadata, is_sensitive
  ) VALUES (
    p_actor_user_id, v_actor_role, p_action, p_resource_type, p_resource_id,
    p_description, p_old_values, p_new_values, p_metadata, p_is_sensitive
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check parental consent
CREATE OR REPLACE FUNCTION check_parental_consent(
  p_student_user_id UUID,
  p_consent_type consent_type
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_consent BOOLEAN;
  v_student_age INT;
BEGIN
  -- Calculate student age
  SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
  INTO v_student_age
  FROM students_profile
  WHERE user_id = p_student_user_id;

  -- If 18 or older, no parental consent needed
  IF v_student_age >= 18 THEN
    RETURN TRUE;
  END IF;

  -- Check for valid consent
  SELECT TRUE INTO v_has_consent
  FROM parental_consents
  WHERE student_user_id = p_student_user_id
    AND consent_type = p_consent_type
    AND status = 'granted'
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN COALESCE(v_has_consent, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SEED DEFAULT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (code, name, description, category, default_for_roles, is_sensitive, requires_audit) VALUES
-- Student permissions
('students.view', 'View Students', 'View student profiles and basic info', 'students', ARRAY['admin', 'tutor'], FALSE, FALSE),
('students.view_progress', 'View Student Progress', 'View mastery levels and learning progress', 'students', ARRAY['admin', 'tutor'], FALSE, FALSE),
('students.edit', 'Edit Students', 'Edit student profiles', 'students', ARRAY['admin'], TRUE, TRUE),
('students.view_pii', 'View Student PII', 'View sensitive student information', 'students', ARRAY['admin'], TRUE, TRUE),

-- Session permissions
('sessions.view', 'View Sessions', 'View session details', 'sessions', ARRAY['admin', 'tutor', 'parent'], FALSE, FALSE),
('sessions.create', 'Create Sessions', 'Book new sessions', 'sessions', ARRAY['admin', 'tutor', 'parent'], FALSE, FALSE),
('sessions.edit', 'Edit Sessions', 'Modify session details', 'sessions', ARRAY['admin', 'tutor'], FALSE, TRUE),
('sessions.cancel', 'Cancel Sessions', 'Cancel existing sessions', 'sessions', ARRAY['admin', 'tutor', 'parent'], FALSE, TRUE),

-- Report permissions
('reports.view', 'View Reports', 'View analytics and reports', 'reports', ARRAY['admin', 'tutor'], FALSE, FALSE),
('reports.export', 'Export Reports', 'Export data from reports', 'reports', ARRAY['admin'], TRUE, TRUE),

-- Billing permissions
('billing.view', 'View Billing', 'View payment history', 'billing', ARRAY['admin', 'parent'], TRUE, FALSE),
('billing.manage', 'Manage Billing', 'Process payments and refunds', 'billing', ARRAY['admin'], TRUE, TRUE),

-- Admin permissions
('admin.users', 'Manage Users', 'Create and manage user accounts', 'admin', ARRAY['admin'], TRUE, TRUE),
('admin.impersonate', 'Impersonate Users', 'Log in as another user', 'admin', ARRAY['admin'], TRUE, TRUE),
('admin.audit', 'View Audit Logs', 'Access audit trail', 'admin', ARRAY['admin'], TRUE, FALSE),
('admin.settings', 'Manage Settings', 'Configure system settings', 'admin', ARRAY['admin'], TRUE, TRUE)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_for_roles = EXCLUDED.default_for_roles;

-- =============================================================================
-- SEED CONSENT TEMPLATES
-- =============================================================================

INSERT INTO consent_templates (consent_type, version, title, summary, full_text, requires_signature, min_age_without_parent, effective_date, expiry_days) VALUES
(
  'account_creation',
  '2024.1',
  'Student Account Creation Consent',
  'I consent to create a MathPivot account for my child and agree to the Terms of Service and Privacy Policy.',
  E'PARENTAL CONSENT FOR STUDENT ACCOUNT CREATION\n\nBy signing below, I, the parent or legal guardian of the minor student named in this form, hereby consent to:\n\n1. The creation of a MathPivot student account for my child\n2. The collection of educational records as described in our Privacy Policy\n3. Communication between MathPivot tutors and my child during tutoring sessions\n\nI understand that:\n- I can review my child''s educational records at any time\n- I can revoke this consent at any time by contacting support@mathpivot.com\n- MathPivot complies with COPPA and FERPA regulations\n\nThis consent is valid until revoked or until my child reaches the age of 18.',
  TRUE,
  18,
  '2024-01-01',
  NULL
),
(
  'data_collection',
  '2024.1',
  'Data Collection Consent',
  'I consent to MathPivot collecting and processing my child''s educational data to provide tutoring services.',
  E'CONSENT FOR DATA COLLECTION AND PROCESSING\n\nI consent to MathPivot collecting the following data about my child:\n\n- Name, grade level, and school information\n- Learning progress and assessment results\n- Session recordings (if enabled) for quality assurance\n- Communication logs with tutors\n\nThis data will be used to:\n- Provide personalized tutoring services\n- Track learning progress\n- Generate progress reports\n- Improve our educational content\n\nData retention: Educational records are retained for 7 years after the last session, or until deletion is requested.',
  FALSE,
  18,
  '2024-01-01',
  365
),
(
  'photo_video',
  '2024.1',
  'Photo/Video Release',
  'I consent to MathPivot using photos or videos of my child for educational and promotional purposes.',
  E'PHOTO AND VIDEO RELEASE\n\nI grant permission to MathPivot to:\n\n1. Record tutoring sessions for quality assurance purposes\n2. Use photos or videos of my child in educational materials\n3. Feature my child in promotional materials (website, social media, brochures)\n\nI understand that:\n- I can opt out of promotional use while still allowing session recordings\n- Recordings are stored securely and not shared with third parties\n- I can request deletion of any recordings',
  FALSE,
  18,
  '2024-01-01',
  365
)
ON CONFLICT (consent_type, version) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE parental_consents IS 'COPPA/FERPA compliant parental consent records';
COMMENT ON TABLE consent_templates IS 'Legal consent text templates with versioning';
COMMENT ON TABLE parent_child_permissions IS 'Fine-grained parent access to student data';
COMMENT ON TABLE tutor_verifications IS 'Background check and credential verification status';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';
COMMENT ON TABLE organizations IS 'Schools and organizations for B2B/SSO';
COMMENT ON TABLE organization_members IS 'User membership in organizations';
COMMENT ON TABLE sso_sessions IS 'SSO-initiated authentication sessions';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON FUNCTION has_permission IS 'Check if user has specific permission';
COMMENT ON FUNCTION log_audit_event IS 'Create audit log entry';
COMMENT ON FUNCTION check_parental_consent IS 'Verify parental consent for student';
