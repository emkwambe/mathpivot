import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMessages } from '@/app/actions/messaging';
import { MessageComposer } from './MessageComposer';

interface Props {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: Props) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get thread info
  const { data: thread } = await supabase
    .from('message_threads')
    .select('id, participant_a, participant_b, student_user_id, subject, status')
    .eq('id', threadId)
    .single();

  if (!thread) {
    redirect('/messages');
  }

  // Verify participation
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    redirect('/messages');
  }

  const otherId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a;

  // Get profiles
  const profileIds = [otherId];
  if (thread.student_user_id) profileIds.push(thread.student_user_id);

  const { data: profiles } = await supabase
    .from('users_profile')
    .select('id, full_name, role, avatar_url')
    .in('id', profileIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const otherProfile = profileMap.get(otherId);
  const studentProfile = thread.student_user_id ? profileMap.get(thread.student_user_id) : null;

  // Get messages
  const { messages, error } = await getMessages(threadId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white rounded-t-xl">
        <Link
          href="/messages"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-700 font-semibold text-sm">
            {otherProfile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <h1 className="font-semibold text-slate-900">
            {otherProfile?.full_name || 'Unknown'}
          </h1>
          <p className="text-xs text-slate-500 capitalize">
            {otherProfile?.role}
            {studentProfile && ` \u00b7 re: ${studentProfile.full_name}`}
          </p>
        </div>
        {thread.subject && (
          <span className="ml-auto text-sm text-slate-500 truncate max-w-[200px]">
            {thread.subject}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {messages.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      {thread.status === 'active' && (
        <MessageComposer threadId={threadId} />
      )}

      {thread.status !== 'active' && (
        <div className="p-4 bg-slate-100 border-t border-slate-200 rounded-b-xl text-center">
          <p className="text-sm text-slate-500">This conversation has been {thread.status}.</p>
        </div>
      )}
    </div>
  );
}
