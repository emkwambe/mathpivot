'use client';

import { useRef, useState } from 'react';
import { sendMessage } from '@/app/actions/messaging';
import { useRouter } from 'next/navigation';

interface MessageComposerProps {
  threadId: string;
}

export function MessageComposer({ threadId }: MessageComposerProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setSending(true);
    setError(null);

    const result = await sendMessage(formData);

    if (!result.success) {
      setError(result.error || 'Failed to send');
      setSending(false);
      return;
    }

    formRef.current?.reset();
    setSending(false);
    router.refresh();

    // Refocus textarea
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white rounded-b-xl p-3">
      {error && (
        <p className="text-red-600 text-xs mb-2">{error}</p>
      )}
      <form ref={formRef} action={handleSubmit} className="flex items-end gap-2">
        <input type="hidden" name="threadId" value={threadId} />
        <textarea
          ref={textareaRef}
          name="body"
          placeholder="Type a message..."
          required
          maxLength={5000}
          rows={1}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex-shrink-0 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
