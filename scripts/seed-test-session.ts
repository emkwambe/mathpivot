/**
 * Seed script to create test data for whiteboard testing
 * Run with: npx tsx scripts/seed-test-session.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedTestSession() {
  console.log('Creating test data for whiteboard testing...\n');

  // Fixed IDs for easy reference
  const familyId = 'dddddddd-4444-4444-4444-dddddddddddd';
  const bookingId = 'eeeeeeee-5555-5555-5555-eeeeeeeeeeee';
  const sessionId = 'ffffffff-6666-6666-6666-ffffffffffff';

  try {
    // 1. Create tutor user via Admin API
    console.log('Creating tutor user...');
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.createUser({
      email: 'test-tutor@mathpivot.test',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: { full_name: 'Test Tutor', role: 'tutor' }
    });

    if (tutorError && !tutorError.message.includes('already been registered')) {
      throw tutorError;
    }

    // Get tutor ID (either from creation or fetch existing)
    let tutorId = tutorData?.user?.id;
    if (!tutorId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingTutor = existingUsers?.users?.find(u => u.email === 'test-tutor@mathpivot.test');
      tutorId = existingTutor?.id;
    }
    console.log(`  Tutor ID: ${tutorId}`);

    // 2. Create parent user
    console.log('Creating parent user...');
    const { data: parentData, error: parentError } = await supabase.auth.admin.createUser({
      email: 'test-parent@mathpivot.test',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: { full_name: 'Test Parent', role: 'parent' }
    });

    if (parentError && !parentError.message.includes('already been registered')) {
      throw parentError;
    }

    let parentId = parentData?.user?.id;
    if (!parentId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingParent = existingUsers?.users?.find(u => u.email === 'test-parent@mathpivot.test');
      parentId = existingParent?.id;
    }
    console.log(`  Parent ID: ${parentId}`);

    // 3. Create student user
    console.log('Creating student user...');
    const { data: studentData, error: studentError } = await supabase.auth.admin.createUser({
      email: 'test-student@mathpivot.test',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: { full_name: 'Test Student', role: 'student' }
    });

    if (studentError && !studentError.message.includes('already been registered')) {
      throw studentError;
    }

    let studentId = studentData?.user?.id;
    if (!studentId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingStudent = existingUsers?.users?.find(u => u.email === 'test-student@mathpivot.test');
      studentId = existingStudent?.id;
    }
    console.log(`  Student ID: ${studentId}`);

    // 4. Create tutor profile
    console.log('Creating tutor profile...');
    await supabase.from('tutors_profile').upsert({
      user_id: tutorId,
      bio: 'Test tutor for whiteboard testing',
      specialties: ['Algebra', 'Calculus'],
      is_active: true
    });

    // 5. Create family
    console.log('Creating family...');
    await supabase.from('families').upsert({
      id: familyId,
      name: 'Test Family',
      primary_parent_user_id: parentId
    });

    // 6. Create family members
    console.log('Creating family members...');
    await supabase.from('family_members').upsert([
      { family_id: familyId, user_id: parentId, member_role: 'parent' },
      { family_id: familyId, user_id: studentId, member_role: 'student' }
    ], { onConflict: 'family_id,user_id' });

    // 7. Create student profile
    console.log('Creating student profile...');
    await supabase.from('students_profile').upsert({
      user_id: studentId,
      family_id: familyId,
      grade: 10,
      course_track: 'math_2',
      goals: 'Test whiteboard functionality'
    });

    // 8. Create booking
    console.log('Creating booking...');
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);

    await supabase.from('bookings').upsert({
      id: bookingId,
      family_id: familyId,
      student_user_id: studentId,
      parent_user_id: parentId,
      tutor_user_id: tutorId,
      start_at: now.toISOString(),
      end_at: endTime.toISOString(),
      modality: 'online',
      status: 'confirmed'
    });

    // 9. Create session
    console.log('Creating session...');
    await supabase.from('sessions').upsert({
      id: sessionId,
      booking_id: bookingId,
      status: 'in_progress',
      started_at: now.toISOString()
    });

    console.log('\n========================================');
    console.log('TEST DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Session ID: ${sessionId}`);
    console.log('');
    console.log('Navigate to:');
    console.log(`http://localhost:3000/tutor/sessions/${sessionId}`);
    console.log('');
    console.log('Login credentials:');
    console.log('  Tutor:   test-tutor@mathpivot.test / testpass123');
    console.log('  Parent:  test-parent@mathpivot.test / testpass123');
    console.log('  Student: test-student@mathpivot.test / testpass123');
    console.log('========================================');

  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

seedTestSession();
