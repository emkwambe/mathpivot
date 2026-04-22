"use client";

import { useState, useTransition } from "react";
import { approveConsent } from "@/app/actions/consent";

interface ConsentItem {
  id: string;
  consent_type: string;
  status: string;
  student_user_id: string;
}

interface ConsentBannerProps {
  consents: ConsentItem[];
}

const CONSENT_DESCRIPTIONS: Record<
  string,
  { title: string; description: string }
> = {
  account_creation: {
    title: "Account Creation Consent",
    description:
      "I consent to the creation of a student account for my child on MathPivot TutorOS. I understand this involves storing their name, email, grade level, and learning data.",
  },
  data_collection: {
    title: "Data Collection Consent",
    description:
      "I consent to the collection and processing of my child's educational data including session records, skill assessments, homework submissions, and progress tracking for the purpose of providing personalized tutoring services.",
  },
  photo_video: {
    title: "Photo/Video Consent",
    description:
      "I consent to the recording of tutoring sessions for quality assurance and review purposes. Recordings are stored securely and accessible only to authorized staff.",
  },
};

export function ConsentBanner({ consents }: ConsentBannerProps) {
  const [pending, setPending] = useState(consents);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pending.length === 0) return null;

  function handleApprove(consentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await approveConsent(consentId);
      if (result.success) {
        setPending((prev) => prev.filter((c) => c.id !== consentId));
      } else {
        setError(result.error || "Failed to approve consent");
      }
    });
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <svg
          className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h3 className="font-semibold text-amber-900">
            Parental Consent Required
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Please review and approve the following consent(s) for your
            child&apos;s account. This is required by COPPA regulations.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {pending.map((consent) => {
          const info = CONSENT_DESCRIPTIONS[consent.consent_type] || {
            title: consent.consent_type,
            description: "Please review and approve this consent.",
          };
          return (
            <div
              key={consent.id}
              className="bg-white border border-amber-100 rounded-lg p-4"
            >
              <h4 className="font-medium text-slate-900 text-sm">
                {info.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 mb-3">
                {info.description}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(consent.id)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Processing..." : "I Approve"}
                </button>
                <span className="text-[10px] text-slate-400">
                  By clicking, you provide verifiable parental consent under
                  COPPA.
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-amber-600 mt-3">
        Note: Consent text is subject to final legal review. You may revoke
        consent at any time by contacting support.
      </p>
    </div>
  );
}
