import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPendingFeedback } from "@/app/actions/session-feedback";
import SessionFeedbackCard from "@/components/SessionFeedbackCard";

export default async function ParentFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pending = await getPendingFeedback(user.id, "parent");

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Check-ins</h1>
        <p className="text-slate-600 text-sm mt-1">
          Confirm attendance and share how your child is doing after each
          coaching session.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1">
            No sessions waiting for your feedback. You&apos;ll be notified after
            each session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((session) => (
            <SessionFeedbackCard
              key={session.sessionId}
              session={session}
              role="parent"
            />
          ))}
        </div>
      )}
    </div>
  );
}
