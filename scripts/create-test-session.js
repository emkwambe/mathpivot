// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestSession() {
  console.log('Creating test session...\n');

  // 1. Get existing users
  const { data: tutor } = await supabase
    .from('users_profile')
    .select('id')
    .eq('email', 'tutor1@mathpivot.dev')
    .single();

  const { data: parent } = await supabase
    .from('users_profile')
    .select('id')
    .eq('email', 'parent1@mathpivot.dev')
    .single();

  const { data: student } = await supabase
    .from('users_profile')
    .select('id')
    .eq('email', 'student1@mathpivot.dev')
    .single();

  if (!tutor || !parent || !student) {
    console.error('Could not find demo users. Check users_profile table.');
    process.exit(1);
  }

  console.log('Found users:');
  console.log('  Tutor:', tutor.id);
  console.log('  Parent:', parent.id);
  console.log('  Student:', student.id);

  // 2. Get or create family
  let { data: studentProfile } = await supabase
    .from('students_profile')
    .select('family_id')
    .eq('user_id', student.id)
    .single();

  let familyId = studentProfile?.family_id;

  if (!familyId) {
    console.log('\nCreating family...');
    const { data: family } = await supabase
      .from('families')
      .insert({ name: 'Demo Family', primary_parent_user_id: parent.id })
      .select()
      .single();
    familyId = family.id;

    await supabase.from('family_members').insert([
      { family_id: familyId, user_id: parent.id, member_role: 'parent' },
      { family_id: familyId, user_id: student.id, member_role: 'student' }
    ]);

    await supabase.from('students_profile').insert({
      user_id: student.id,
      family_id: familyId,
      grade: 10,
      course_track: 'math_2'
    });
  }

  console.log('  Family:', familyId);

  // 3. Ensure tutor profile exists
  await supabase.from('tutors_profile').upsert({
    user_id: tutor.id,
    bio: 'Demo tutor',
    specialties: ['Algebra'],
    is_active: true
  });

  // 4. Create booking
  console.log('\nCreating booking...');
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      family_id: familyId,
      student_user_id: student.id,
      parent_user_id: parent.id,
      tutor_user_id: tutor.id,
      start_at: now.toISOString(),
      end_at: endTime.toISOString(),
      modality: 'online',
      status: 'confirmed'
    })
    .select()
    .single();

  if (bookingError) {
    console.error('Booking error:', bookingError);
    process.exit(1);
  }

  console.log('  Booking:', booking.id);

  // 5. Create session
  console.log('Creating session...');
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      booking_id: booking.id,
      status: 'in_progress',
      started_at: now.toISOString()
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Session error:', sessionError);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TEST SESSION CREATED!');
  console.log('========================================');
  console.log('Session ID:', session.id);
  console.log('');
  console.log('URL: http://localhost:3000/tutor/sessions/' + session.id);
  console.log('');
  console.log('Login: tutor1@mathpivot.dev / Demo123!');
  console.log('========================================');
}

createTestSession().catch(console.error);
