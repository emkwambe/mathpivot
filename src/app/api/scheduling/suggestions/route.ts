import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSchedulingSuggestions } from '@/lib/scheduling/intelligent-scheduler';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentUserId = searchParams.get('studentId');

    // Parents can get suggestions for their children
    if (user.role === 'parent') {
      if (!studentUserId) {
        return NextResponse.json(
          { error: 'studentId is required' },
          { status: 400 }
        );
      }

      // Verify parent has access to this student
      const supabase = await createClient();
      const { data: familyAccess } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .eq('member_role', 'parent')
        .single();

      if (!familyAccess) {
        return NextResponse.json(
          { error: 'Family not found' },
          { status: 404 }
        );
      }

      const { data: studentFamily } = await supabase
        .from('students_profile')
        .select('family_id')
        .eq('user_id', studentUserId)
        .eq('family_id', familyAccess.family_id)
        .single();

      if (!studentFamily) {
        return NextResponse.json(
          { error: 'Student not found in family' },
          { status: 403 }
        );
      }

      const suggestions = await getSchedulingSuggestions(studentUserId);
      return NextResponse.json({ suggestions });
    }

    // Students can get their own suggestions
    if (user.role === 'student') {
      const suggestions = await getSchedulingSuggestions(user.id);
      return NextResponse.json({ suggestions });
    }

    // Admins and super admins can get any student's suggestions
    if ((user.role === 'admin' || user.role === 'super_admin') && studentUserId) {
      const suggestions = await getSchedulingSuggestions(studentUserId);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Scheduling suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
