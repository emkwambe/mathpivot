"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "@/app/actions/messaging";

interface Contact {
  id: string;
  full_name: string;
  role: string;
}

interface Student {
  id: string;
  full_name: string;
}

interface NewConversationDialogProps {
  contacts: Contact[];
  students: Student[];
}

export function NewConversationDialog({
  contacts,
  students,
}: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const roleColors: Record<string, string> = {
    tutor: "bg-emerald-100 text-emerald-700",
    parent: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
    student: "bg-amber-100 text-amber-700",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContact || !body.trim()) return;

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("recipientId", selectedContact);
      if (selectedStudent) formData.set("studentUserId", selectedStudent);
      if (subject.trim()) formData.set("subject", subject.trim());
      formData.set("body", body.trim());

      const result = await createThread(formData);

      if (!result.success) {
        setError(result.error || "Failed to start conversation");
        return;
      }

      setOpen(false);
      setSelectedContact("");
      setSelectedStudent("");
      setSubject("");
      setBody("");

      if (result.threadId) {
        router.push(`/messages/${result.threadId}`);
      } else {
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        New Message
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            New Conversation
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Recipient selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              To
            </label>
            {contacts.length > 0 ? (
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select a recipient...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                    {contact.role ? ` (${contact.role})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No contacts available. Book a session first to connect with a
                tutor.
              </p>
            )}
          </div>

          {/* Student context (optional) */}
          {students.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Regarding student{" "}
                <span className="text-slate-400">(optional)</span>
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">General conversation</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subject <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Question about homework"
              maxLength={200}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Message body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              maxLength={5000}
              placeholder="Write your message..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedContact || !body.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
