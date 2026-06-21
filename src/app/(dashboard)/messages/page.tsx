import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getThreads, getMessageableContacts } from "@/app/actions/messaging";
import { NewConversationDialog } from "./NewConversationDialog";
import { formatRelativeTime } from "@/lib/utils";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [threadsResult, contactsResult] = await Promise.all([
    getThreads(),
    getMessageableContacts(),
  ]);

  const { threads, error } = threadsResult;
  const { contacts, students } = contactsResult;

  // Get last message preview for each thread
  const threadIds = threads.map((t: { id: string }) => t.id);
  const lastMessages: Record<string, string> = {};
  if (threadIds.length > 0) {
    const { data: previews } = await supabase
      .from("messages")
      .select("thread_id, body, sender_id")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    // Take the first (most recent) message per thread
    const seen = new Set<string>();
    for (const msg of previews || []) {
      if (!seen.has(msg.thread_id)) {
        const prefix = msg.sender_id === user.id ? "You: " : "";
        lastMessages[msg.thread_id] = prefix + (msg.body?.slice(0, 80) || "");
        if (msg.body && msg.body.length > 80) {
          lastMessages[msg.thread_id] += "...";
        }
        seen.add(msg.thread_id);
      }
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500">
            {threads.length} conversation{threads.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewConversationDialog contacts={contacts} students={students} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            No conversations yet
          </h2>
          <p className="text-slate-500 mb-4">
            Start a conversation with your coach or parent to get started.
          </p>
          {contacts.length > 0 && (
            <NewConversationDialog contacts={contacts} students={students} />
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
              className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${
                thread.unreadCount > 0 ? "bg-blue-50/50" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                  thread.unreadCount > 0 ? "bg-blue-200" : "bg-slate-100"
                }`}
              >
                <span
                  className={`font-semibold text-sm ${
                    thread.unreadCount > 0 ? "text-blue-700" : "text-slate-600"
                  }`}
                >
                  {thread.otherParticipant?.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "?"}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate ${
                      thread.unreadCount > 0
                        ? "font-bold text-slate-900"
                        : "font-medium text-slate-900"
                    }`}
                  >
                    {thread.otherParticipant?.full_name || "Unknown"}
                  </span>
                  <span className="text-xs text-slate-400 capitalize flex-shrink-0">
                    {thread.otherParticipant?.role}
                  </span>
                  {thread.studentProfile && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      {thread.studentProfile.full_name}
                    </span>
                  )}
                </div>

                {/* Last message preview */}
                <p
                  className={`text-sm truncate mt-0.5 ${
                    thread.unreadCount > 0
                      ? "text-slate-700 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {lastMessages[thread.id] ||
                    thread.subject ||
                    "No messages yet"}
                </p>
              </div>

              {/* Timestamp + unread */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="text-xs text-slate-400">
                  {thread.last_message_at
                    ? formatRelativeTime(thread.last_message_at)
                    : ""}
                </span>
                {thread.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
