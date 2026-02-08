-- ============================================================================
-- PART 1: AUTH USERS AND IDENTITIES
-- ============================================================================

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES
-- Admin
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  'authenticated',
  'authenticated'
),
-- Tutor 1
(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'tutor1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sarah Johnson"}',
  'authenticated',
  'authenticated'
),
-- Tutor 2
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'tutor2@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Michael Chen"}',
  'authenticated',
  'authenticated'
),
-- Parent 1
(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'parent1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jennifer Smith"}',
  'authenticated',
  'authenticated'
),
-- Student 1
(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000000',
  'student1@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Emma Smith"}',
  'authenticated',
  'authenticated'
),
-- Student 2
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000000',
  'student2@mathpivot.dev',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jake Smith"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create identities for email login
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', '{"sub": "00000000-0000-0000-0000-000000000010", "email": "tutor1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000010', NOW(), NOW()),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '{"sub": "00000000-0000-0000-0000-000000000011", "email": "tutor2@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000011', NOW(), NOW()),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', '{"sub": "00000000-0000-0000-0000-000000000020", "email": "parent1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000020', NOW(), NOW()),
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000030', '{"sub": "00000000-0000-0000-0000-000000000030", "email": "student1@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000030', NOW(), NOW()),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000031', '{"sub": "00000000-0000-0000-0000-000000000031", "email": "student2@mathpivot.dev"}', 'email', '00000000-0000-0000-0000-000000000031', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
