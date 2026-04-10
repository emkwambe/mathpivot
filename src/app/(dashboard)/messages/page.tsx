import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getThreads } from '@/app/actions/messaging';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { threads, error } = await getThreads();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-lg font-semibold text-slate-700">No conversations yet</h2>
          <p className="text-slate-500 mt-1">
            Messages with your tutors and parents will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-sm">
                  {thread.otherParticipant?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 truncate">
                    {thread.otherParticipant?.full_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {thread.otherParticipant?.role}
                  </span>
                  {thread.studentProfile && (
                    <span className="text-xs text-slate-400">
                      re: {thread.studentProfile.full_name}
                    </span>
                  )}
                </div>
                {thread.subject && (
                  <p className="text-sm text-slate-600 truncate">{thread.subject}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  {thread.last_message_at
                    ? new Date(thread.last_message_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'No messages'}
                </p>
              </div>

              {/* Unread badge */}
              {thread.unreadCount > 0 && (
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
