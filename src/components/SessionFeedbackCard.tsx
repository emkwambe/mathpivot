"use client";

import { useState, useTransition } from "react";
import { submitSessionFeedback } from "@/app/actions/session-feedback";
import {
  CheckCircle2,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";

interface PendingSession {
  sessionId: string;
  completedAt: string;
  studentId: string;
  coachName: string;
}

export default function SessionFeedbackCard({
  session,
  role,
}: {
  session: PendingSession;
  role: "student" | "parent";
}) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [concern, setConcern] = useState("");

  function handleSubmit() {
    if (!attendance) return;

    const formData = new FormData();
    formData.set("sessionId", session.sessionId);
    formData.set("studentId", session.studentId);
    formData.set("attendance", attendance);
    if (reflection) formData.set("reflection", reflection);
    if (concern) formData.set("parentConcern", concern);

    startTransition(async () => {
      const result = await submitSessionFeedback(formData);
      if (result.success) setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="font-semibold text-emerald-800">Feedback submitted!</p>
        <p className="text-sm text-emerald-600 mt-1">
          Thank you for helping us improve.
        </p>
      </div>
    );
  }

  const sessionDate = new Date(session.completedAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Session with {session.coachName}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">{sessionDate}</p>
          </div>
          <MessageCircle className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            {role === "student"
              ? "Did you attend this session?"
              : "Did your child attend this session?"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setAttendance("yes")}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                attendance === "yes"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <ThumbsUp
                className={`w-5 h-5 mx-auto mb-1 ${attendance === "yes" ? "text-emerald-500" : "text-slate-400"}`}
              />
              Yes, attended
            </button>
            <button
              onClick={() => setAttendance("no")}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                attendance === "no"
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 mx-auto mb-1 ${attendance === "no" ? "text-red-400" : "text-slate-400"}`}
              />
              Did not attend
            </button>
          </div>
        </div>

        {attendance === "yes" && (
          <>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                How was the session?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`w-12 h-12 rounded-xl text-lg transition-all ${
                      rating && rating >= n
                        ? "bg-amber-400 text-white scale-110"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {"★"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">
                {rating === 5
                  ? "Excellent!"
                  : rating === 4
                    ? "Great"
                    : rating === 3
                      ? "Good"
                      : rating === 2
                        ? "Needs improvement"
                        : rating === 1
                          ? "Poor"
                          : "Tap to rate"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                {role === "student"
                  ? "What did you learn today? (optional)"
                  : "How is your child feeling about their progress? (optional)"}
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={
                  role === "student"
                    ? "I learned about..."
                    : "My child mentioned..."
                }
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all resize-none"
              />
            </div>
          </>
        )}

        {role === "parent" && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Any concerns for the coach? (optional, private)
            </p>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="This goes directly to your child's math coach..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all resize-none"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!attendance || isPending}
          className="w-full py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
