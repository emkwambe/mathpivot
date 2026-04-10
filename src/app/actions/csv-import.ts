'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ImportResult = { success: boolean; error?: string; jobId?: string; processed?: number; errors?: string[] };

// ============================================================
// PARSE CSV STRING INTO ROWS
// ============================================================
function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

// ============================================================
// IMPORT STUDENTS CSV
// Expected columns: full_name, email, grade, course_track, parent_email
// ============================================================
export async function importStudentsCSV(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const csvText = await file.text();
  const { headers, rows } = parseCSV(csvText);

  if (!headers.includes('full_name') || !headers.includes('email')) {
    return { success: false, error: 'CSV must have full_name and email columns' };
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let successCount = 0;

  // Create import job
  const { data: job } = await admin
    .from('csv_import_jobs')
    .insert({
      entity_type: 'students',
      file_name: file.name,
      total_rows: rows.length,
      status: 'processing',
      imported_by: user.id,
    })
    .select('id')
    .single();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Create auth user
      const { data: newUser, error: authError } = await admin.auth.admin.createUser({
        email: row.email,
        password: 'Welcome123!',
        email_confirm: true,
        user_metadata: { full_name: row.full_name, role: 'student' },
      });

      if (authError) {
        errors.push(`Row ${i + 2}: ${authError.message}`);
        continue;
      }

      // Update profile
      await admin.from('users_profile').upsert({
        id: newUser.user.id,
        email: row.email,
        role: 'student',
        full_name: row.full_name,
      }, { onConflict: 'id' });

      // If parent_email provided, link to family
      if (row.parent_email) {
        const { data: parentProfile } = await admin
          .from('users_profile')
          .select('id')
          .eq('email', row.parent_email)
          .single();

        if (parentProfile) {
          const { data: family } = await admin
            .from('family_members')
            .select('family_id')
            .eq('user_id', parentProfile.id)
            .eq('member_role', 'parent')
            .single();

          if (family) {
            await admin.from('students_profile').upsert({
              user_id: newUser.user.id,
              family_id: family.family_id,
              grade: parseInt(row.grade) || 9,
              course_track: row.course_track || 'math_1',
            }, { onConflict: 'user_id' });

            await admin.from('family_members').upsert({
              family_id: family.family_id,
              user_id: newUser.user.id,
              member_role: 'student',
            }, { onConflict: 'family_id,user_id' });
          }
        }
      }

      successCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  // Update job
  if (job) {
    await admin.from('csv_import_jobs').update({
      status: errors.length === rows.length ? 'failed' : 'completed',
      processed_rows: rows.length,
      success_rows: successCount,
      error_rows: errors.length,
      errors: errors.slice(0, 50),
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);
  }

  revalidatePath('/admin/import');
  return { success: true, jobId: job?.id, processed: successCount, errors: errors.slice(0, 10) };
}

// ============================================================
// IMPORT TUTORS CSV
// Expected columns: full_name, email, specialties, hourly_rate
// ============================================================
export async function importTutorsCSV(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  const csvText = await file.text();
  const { headers, rows } = parseCSV(csvText);

  if (!headers.includes('full_name') || !headers.includes('email')) {
    return { success: false, error: 'CSV must have full_name and email columns' };
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let successCount = 0;

  const { data: job } = await admin
    .from('csv_import_jobs')
    .insert({
      entity_type: 'tutors',
      file_name: file.name,
      total_rows: rows.length,
      status: 'processing',
      imported_by: user.id,
    })
    .select('id')
    .single();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const { data: newUser, error: authError } = await admin.auth.admin.createUser({
        email: row.email,
        password: 'Welcome123!',
        email_confirm: true,
        user_metadata: { full_name: row.full_name, role: 'tutor' },
      });

      if (authError) {
        errors.push(`Row ${i + 2}: ${authError.message}`);
        continue;
      }

      await admin.from('users_profile').upsert({
        id: newUser.user.id,
        email: row.email,
        role: 'tutor',
        full_name: row.full_name,
      }, { onConflict: 'id' });

      const specialties = row.specialties ? row.specialties.split(';').map((s: string) => s.trim()) : [];
      const hourlyRate = row.hourly_rate ? parseInt(row.hourly_rate) * 100 : null;

      await admin.from('tutors_profile').upsert({
        user_id: newUser.user.id,
        specialties,
        hourly_rate: hourlyRate,
        is_active: true,
      }, { onConflict: 'user_id' });

      successCount++;
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  if (job) {
    await admin.from('csv_import_jobs').update({
      status: errors.length === rows.length ? 'failed' : 'completed',
      processed_rows: rows.length,
      success_rows: successCount,
      error_rows: errors.length,
      errors: errors.slice(0, 50),
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);
  }

  revalidatePath('/admin/import');
  return { success: true, jobId: job?.id, processed: successCount, errors: errors.slice(0, 10) };
}

// ============================================================
// EXPORT DATA AS CSV
// ============================================================
export async function exportStudentsCSV(): Promise<{ csv: string; error?: string }> {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from('users_profile')
    .select('id, full_name, email, role, created_at')
    .eq('role', 'student')
    .order('full_name');

  if (!students || students.length === 0) return { csv: '', error: 'No students found' };

  const headers = 'full_name,email,role,created_at';
  const rows = students.map(s => `"${s.full_name}","${s.email}","${s.role}","${s.created_at}"`);
  return { csv: [headers, ...rows].join('\n') };
}

export async function exportTutorsCSV(): Promise<{ csv: string; error?: string }> {
  const supabase = await createClient();

  const { data: tutors } = await supabase
    .from('tutors_profile')
    .select(`
      user_id,
      specialties,
      hourly_rate,
      is_active,
      user:user_id (full_name, email)
    `) as { data: any[] | null };

  if (!tutors || tutors.length === 0) return { csv: '', error: 'No tutors found' };

  const headers = 'full_name,email,specialties,hourly_rate_cents,is_active';
  const rows = tutors.map((t: any) => `"${t.user?.full_name || ''}","${t.user?.email || ''}","${(t.specialties || []).join(';')}",${t.hourly_rate || 0},${t.is_active}`);
  return { csv: [headers, ...rows].join('\n') };
}

export async function exportSessionsCSV(dateFrom: string, dateTo: string): Promise<{ csv: string; error?: string }> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, status, attendance_status, completed_at,
      booking:booking_id (start_at, end_at, modality, tutor_user_id, student_user_id)
    `)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .order('created_at', { ascending: false }) as { data: any[] | null };

  if (!sessions || sessions.length === 0) return { csv: '', error: 'No sessions found' };

  const headers = 'session_id,status,attendance,start_at,end_at,modality,completed_at';
  const rows = sessions.map((s: any) => `"${s.id}","${s.status}","${s.attendance_status || ''}","${s.booking?.start_at || ''}","${s.booking?.end_at || ''}","${s.booking?.modality || ''}","${s.completed_at || ''}"`);
  return { csv: [headers, ...rows].join('\n') };
}

// ============================================================
// GET IMPORT HISTORY
// ============================================================
export async function getImportHistory() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('csv_import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { jobs: [], error: error.message };
  return { jobs: data || [], error: null };
}
