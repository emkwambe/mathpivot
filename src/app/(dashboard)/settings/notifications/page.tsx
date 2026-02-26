'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  notification_type: string;
  is_enabled: boolean;
}

const NOTIFICATION_TYPES = [
  { key: 'booking_confirmation', label: 'Session Confirmations', description: 'When a session is booked or confirmed' },
  { key: 'session_reminder', label: 'Session Reminders', description: 'Reminders before upcoming sessions' },
  { key: 'session_summary', label: 'Session Summaries', description: 'Summary after each session' },
  { key: 'credit_alerts', label: 'Credit Alerts', description: 'Low balance and credit updates' },
  { key: 'weekly_report', label: 'Weekly Reports', description: 'Weekly progress summary' },
  { key: 'homework_reminder', label: 'Homework Reminders', description: 'Due date reminders for homework' },
  { key: 'marketing', label: 'News & Updates', description: 'New features and promotions' },
];

const CHANNELS: { key: NotificationChannel; label: string; icon: React.ReactNode }[] = [
  {
    key: 'email',
    label: 'Email',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'in_app',
    label: 'In-App',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    key: 'push',
    label: 'Push',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      const prefMap = new Map<string, boolean>();
      data?.forEach((pref: NotificationPreference) => {
        prefMap.set(`${pref.notification_type}_${pref.channel}`, pref.is_enabled);
      });

      // Set defaults for missing preferences
      NOTIFICATION_TYPES.forEach(type => {
        CHANNELS.forEach(channel => {
          const key = `${type.key}_${channel.key}`;
          if (!prefMap.has(key)) {
            // Default: email and in_app enabled, push disabled
            prefMap.set(key, channel.key === 'email' || channel.key === 'in_app');
          }
        });
      });

      setPreferences(prefMap);
      setLoading(false);
    }

    loadPreferences();
  }, []);

  async function togglePreference(notificationType: string, channel: NotificationChannel) {
    if (!userId) return;

    const key = `${notificationType}_${channel}`;
    const newValue = !preferences.get(key);

    setPreferences(prev => new Map(prev).set(key, newValue));
    setSaving(true);

    const supabase = createClient();

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        channel,
        notification_type: notificationType,
        is_enabled: newValue,
      }, {
        onConflict: 'user_id,channel,notification_type'
      });

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
        <p className="text-slate-600">Choose how you want to receive notifications</p>
      </div>

      {/* Channel Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {CHANNELS.map(channel => (
              <div key={channel.key} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-slate-400">{channel.icon}</span>
                <span>{channel.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {NOTIFICATION_TYPES.map(type => (
              <div
                key={type.key}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{type.label}</h4>
                  <p className="text-sm text-slate-500">{type.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  {CHANNELS.map(channel => {
                    const key = `${type.key}_${channel.key}`;
                    const isEnabled = preferences.get(key) ?? false;

                    return (
                      <button
                        key={channel.key}
                        onClick={() => togglePreference(type.key, channel.key)}
                        className={`p-2 rounded-lg transition-colors ${
                          isEnabled
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                        title={`${isEnabled ? 'Disable' : 'Enable'} ${channel.label}`}
                      >
                        {channel.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}

      {/* Browser Push Permission */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900">Browser Push Notifications</h4>
              <p className="text-sm text-slate-500">Enable push notifications in your browser</p>
            </div>
            <button
              onClick={async () => {
                if ('Notification' in window) {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    new Notification('Notifications Enabled', {
                      body: 'You will now receive push notifications from MathPivot.',
                      icon: '/favicon.ico'
                    });
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Enable Push
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
