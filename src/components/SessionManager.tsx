'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SessionManagerProps {
  /** Session timeout in minutes (default: 60) */
  sessionTimeout?: number;
  /** Warning before timeout in minutes (default: 5) */
  warningBefore?: number;
  /** Callback when session expires */
  onSessionExpired?: () => void;
  /** Callback when session is about to expire */
  onSessionWarning?: (minutesLeft: number) => void;
  children: React.ReactNode;
}

interface SessionState {
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date | null;
  showWarning: boolean;
  minutesLeft: number;
}

/**
 * Session Manager Component
 * Handles automatic session refresh, timeout warnings, and activity tracking
 */
export function SessionManager({
  sessionTimeout = 60,
  warningBefore = 5,
  onSessionExpired,
  onSessionWarning,
  children,
}: SessionManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    lastActivity: new Date(),
    expiresAt: null,
    showWarning: false,
    minutesLeft: sessionTimeout,
  });

  // Update last activity
  const updateActivity = useCallback(() => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionTimeout * 60 * 1000);

    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      expiresAt,
      showWarning: false,
      minutesLeft: sessionTimeout,
    }));

    // Clear existing timeouts
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Set warning timeout
    const warningTime = (sessionTimeout - warningBefore) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      setSessionState(prev => ({
        ...prev,
        showWarning: true,
        minutesLeft: warningBefore,
      }));
      onSessionWarning?.(warningBefore);
    }, warningTime);

    // Set expiry timeout
    activityTimeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, sessionTimeout * 60 * 1000);
  }, [sessionTimeout, warningBefore, onSessionWarning]);

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      showWarning: false,
    }));

    // Sign out from Supabase
    await supabase.auth.signOut();

    onSessionExpired?.();

    // Redirect to login
    router.push('/login?reason=session_expired');
  }, [supabase, router, onSessionExpired]);

  // Extend session (refresh)
  const extendSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;

      updateActivity();
      setSessionState(prev => ({ ...prev, showWarning: false }));
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleSessionExpired();
    }
  }, [supabase, updateActivity, handleSessionExpired]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      // Debounce activity updates (max once per minute)
      const now = new Date();
      const lastActivity = sessionState.lastActivity;
      const timeSinceLastActivity = now.getTime() - lastActivity.getTime();

      if (timeSinceLastActivity > 60000) {
        updateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity
    updateActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [updateActivity]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setSessionState(prev => ({ ...prev, isActive: false }));
      } else if (event === 'TOKEN_REFRESHED') {
        updateActivity();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, updateActivity]);

  // Countdown timer for warning
  useEffect(() => {
    if (!sessionState.showWarning) return;

    const interval = setInterval(() => {
      setSessionState(prev => {
        const minutesLeft = Math.max(0, prev.minutesLeft - 1/60);
        if (minutesLeft <= 0) {
          handleSessionExpired();
        }
        return { ...prev, minutesLeft };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState.showWarning, handleSessionExpired]);

  return (
    <>
      {children}

      {/* Session Warning Modal */}
      {sessionState.showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Session Expiring</h3>
                <p className="text-sm text-slate-500">
                  Your session will expire in {Math.ceil(sessionState.minutesLeft)} minute{Math.ceil(sessionState.minutesLeft) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              For your security, you&apos;ll be signed out due to inactivity.
              Click below to stay signed in.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleSessionExpired()}
                className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={extendSession}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Stay Signed In
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${(sessionState.minutesLeft / warningBefore) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Hook to access session state
 */
export function useSessionState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { isAuthenticated };
}
