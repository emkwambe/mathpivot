"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createThread } from "@/app/actions/messaging";

interface MessageButtonProps {
  recipientId: string;
  recipientName: string;
  studentUserId?: string;
  subject?: string;
  size?: "sm" | "md";
  variant?: "primary" | "ghost";
}

/**
 * Quick message button — creates or navigates to an existing thread
 * with the given recipient.
 */
export function MessageButton({
  recipientId,
  recipientName,
  studentUserId,
  subject,
  size = "sm",
  variant = "ghost",
}: MessageButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      // Create a thread with a brief intro message
      const formData = new FormData();
      formData.set("recipientId", recipientId);
      if (studentUserId) formData.set("studentUserId", studentUserId);
      if (subject) formData.set("subject", subject);
      formData.set(
        "body",
        `Hi ${recipientName.split(" ")[0]}, I'd like to connect with you.`,
      );

      const result = await createThread(formData);

      if (result.threadId) {
        router.push(`/messages/${result.threadId}`);
      } else {
        router.push("/messages");
      }
    });
  }

  const sizeClasses =
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const variantClasses =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "text-blue-600 hover:bg-blue-50 border border-blue-200";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${sizeClasses} ${variantClasses}`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {isPending ? "Opening..." : "Message"}
    </button>
  );
}
