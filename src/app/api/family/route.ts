import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id, role, family:families(*)')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  }

  return NextResponse.json({
    familyId: familyMember.family_id,
    role: familyMember.role,
    family: familyMember.family,
  });
}
