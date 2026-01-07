'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DemoAccount {
  email: string;
  password: string;
  role: 'admin' | 'tutor' | 'parent' | 'student';
  name: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'admin@mathpivot.dev', password: 'Demo123!', role: 'admin', name: 'Admin', color: 'bg-purple-500' },
  { email: 'tutor1@mathpivot.dev', password: 'Demo123!', role: 'tutor', name: 'Sarah (Tutor)', color: 'bg-green-500' },
  { email: 'tutor2@mathpivot.dev', password: 'Demo123!', role: 'tutor', name: 'Michael (Tutor)', color: 'bg-emerald-500' },
  { email: 'parent1@mathpivot.dev', password: 'Demo123!', role: 'parent', name: 'Jennifer (Parent)', color: 'bg-blue-500' },
  { email: 'student1@mathpivot.dev', password: 'Demo123!', role: 'student', name: 'Emma (Student)', color: 'bg-orange-500' },
  { email: 'student2@mathpivot.dev', password: 'Demo123!', role: 'student', name: 'Jake (Student)', color: 'bg-amber-500' },
];

interface DevAccountSwitcherProps {
  currentEmail?: string;
}

export function DevAccountSwitcher({ currentEmail }: DevAccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleSwitch = async (account: DemoAccount) => {
    setIsLoading(account.email);
    setError(null);

    const supabase = createClient();

    // Sign out first
    await supabase.auth.signOut();

    // Sign in with new account
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (signInError) {
      setError(`Failed: ${signInError.message}`);
      setIsLoading(null);
      return;
    }

    // Redirect based on role
    const redirectPath = account.role === 'admin' ? '/admin'
      : account.role === 'tutor' ? '/tutor'
      : '/parent';

    router.push(redirectPath);
    router.refresh();
    setIsOpen(false);
    setIsLoading(null);
  };

  const currentAccount = DEMO_ACCOUNTS.find(a => a.email === currentEmail);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-16 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-2 text-sm whitespace-nowrap">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 w-72 mb-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-900">Switch Account</h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEV ONLY</span>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleSwitch(account)}
                disabled={isLoading !== null}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                  currentEmail === account.email
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-slate-50 border-2 border-transparent'
                } ${isLoading === account.email ? 'opacity-50' : ''}`}
              >
                <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {account.role[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{account.name}</p>
                  <p className="text-xs text-slate-500 truncate">{account.email}</p>
                </div>
                {currentEmail === account.email && (
                  <span className="text-xs text-blue-600 font-medium">Active</span>
                )}
                {isLoading === account.email && (
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Password for all accounts: <code className="bg-slate-100 px-1 rounded">Demo123!</code>
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
          isOpen
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm font-medium">
          {currentAccount ? currentAccount.name : 'Switch User'}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
