'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string | null;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on open
  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !showHistory) {
      inputRef.current?.focus();
    }
  }, [isOpen, showHistory]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/ai/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (convoId: string) => {
    try {
      const res = await fetch(`/api/ai/chat?conversationId=${convoId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((m: { role: string; content: string }, i: number) => ({
            id: `${convoId}-${i}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(),
          }))
        );
        setConversationId(convoId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick action suggestions
  const suggestions = [
    'Help me with equations',
    'Explain fractions',
    'Word problem help',
    'Practice problems',
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-all',
          'flex items-center justify-center',
          isOpen
            ? 'bg-slate-800 text-white rotate-0'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-105'
        )}
        aria-label={isOpen ? 'Close AI Tutor' : 'Open AI Tutor'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">AI Math Tutor</h3>
                  <p className="text-xs text-blue-100">Here to help you learn</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Chat history"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={startNewChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="New chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* History Panel */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-medium text-slate-600 mb-3">Recent Conversations</h4>
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map(convo => (
                    <button
                      key={convo.id}
                      onClick={() => loadConversation(convo.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                    >
                      <p className="font-medium text-slate-900 text-sm truncate">{convo.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {convo.message_count} messages
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No conversations yet</p>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-2">Hi! I&apos;m your AI Math Tutor</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Ask me anything about math - I&apos;m here to help you understand!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5',
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-900 rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me a math question..."
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      input.trim() && !isLoading
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
