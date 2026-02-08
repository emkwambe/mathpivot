import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WhiteboardEditClient } from './WhiteboardEditClient';

// Server Action for delete
async function deleteWhiteboardAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');
  const { redirect } = await import('next/navigation');

  const user = await getCurrentUser();
  if (!user || (user.role !== 'tutor' && user.role !== 'admin')) return;

  const whiteboardId = formData.get('whiteboardId') as string;
  const supabase = await createClient();

  await supabase
    .from('whiteboards')
    .delete()
    .eq('id', whiteboardId)
    .eq('tutor_user_id', user.id);

  revalidatePath('/tutor/whiteboards');
  redirect('/tutor/whiteboards');
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WhiteboardEditorPage({ params }: Props) {
  const { id } = await params;
  const user = await requireRole(['tutor', 'admin']);
  const supabase = await createClient();

  const { data: whiteboard, error } = await supabase
    .from('whiteboards')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !whiteboard) {
    notFound();
  }

  // Verify ownership (unless admin)
  if (whiteboard.tutor_user_id !== user.id && user.role !== 'admin') {
    redirect('/tutor/whiteboards');
  }

  return (
    <WhiteboardEditClient
      whiteboard={{
        id: whiteboard.id,
        name: whiteboard.name,
        description: whiteboard.description,
        tags: whiteboard.tags,
        is_public: whiteboard.is_public,
        elements: whiteboard.elements,
        created_at: whiteboard.created_at,
        updated_at: whiteboard.updated_at,
      }}
      deleteAction={deleteWhiteboardAction}
    />
  );
}
