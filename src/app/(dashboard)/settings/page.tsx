'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState({
    timeFormat: '12h' as '12h' | '24h',
    timezone: 'America/New_York',
  });
  const router = useRouter();

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('time_format, timezone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSettings({
          timeFormat: (profile.time_format as '12h' | '24h') || '12h',
          timezone: profile.timezone || 'America/New_York',
        });
      }
      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('users_profile')
      .update({
        time_format: settings.timeFormat,
        timezone: settings.timezone,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    }
    setSaving(false);
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-center text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your preferences</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {/* Time Format */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-1">Time Format</h3>
          <p className="text-sm text-slate-500 mb-4">
            Choose how times are displayed throughout the app
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="12h"
                checked={settings.timeFormat === '12h'}
                onChange={() => setSettings({ ...settings, timeFormat: '12h' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-slate-900">12-hour</span>
                <span className="text-slate-500 ml-2">3:00 PM</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="24h"
                checked={settings.timeFormat === '24h'}
                onChange={() => setSettings({ ...settings, timeFormat: '24h' })}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-slate-900">24-hour</span>
                <span className="text-slate-500 ml-2">15:00</span>
              </div>
            </label>
          </div>
        </div>

        {/* Timezone */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-1">Timezone</h3>
          <p className="text-sm text-slate-500 mb-4">
            Set your local timezone for scheduling
          </p>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
