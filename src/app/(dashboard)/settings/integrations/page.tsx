"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";

interface Integration {
  id: string;
  provider: string;
  email: string | null;
  scopes: string | null;
  connected_at: string;
  metadata: Record<string, unknown>;
}

interface ClassroomCourse {
  id: string;
  course_id: string;
  course_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
}

const AVAILABLE_INTEGRATIONS = [
  {
    provider: "google",
    name: "Google Calendar",
    description: "Sync your coaching sessions with Google Calendar",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    scopes: ["calendar.events", "calendar.readonly"],
  },
  {
    provider: "zoom",
    name: "Zoom",
    description: "Automatically create Zoom meetings for online sessions",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#2D8CFF" />
        <path
          fill="white"
          d="M7 8.5h5.5c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5H7c-.83 0-1.5-.67-1.5-1.5v-4c0-.83.67-1.5 1.5-1.5zm8.5 1l2.5-1.5v8l-2.5-1.5v-5z"
        />
      </svg>
    ),
    scopes: ["meeting:write", "meeting:read"],
  },
  {
    provider: "classroom",
    name: "Google Classroom",
    description: "Import student progress from Google Classroom courses",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24">
        <rect fill="#0F9D58" width="24" height="24" rx="4" />
        <path
          fill="white"
          d="M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 1.5c-2 0-6 1-6 3v1.5h12v-1.5c0-2-4-3-6-3z"
        />
        <path
          fill="#57BB8A"
          d="M18 11c.83 0 1.5-.67 1.5-1.5S18.83 8 18 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm0 1c-1.11 0-2.5.5-2.5 1.5v1h5v-1c0-1-1.39-1.5-2.5-1.5z"
        />
      </svg>
    ),
    scopes: ["classroom.courses.readonly", "classroom.rosters.readonly"],
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    async function loadIntegrations() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get connected integrations
      const { data: integrationData } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id);

      setIntegrations(integrationData || []);

      // Get classroom courses if connected
      const hasClassroom = integrationData?.some(
        (i) => i.provider === "classroom",
      );
      if (hasClassroom) {
        const { data: courses } = await supabase
          .from("classroom_sync")
          .select("*")
          .eq("user_id", user.id);
        setClassroomCourses(courses || []);
      }

      setLoading(false);
    }

    loadIntegrations();
  }, []);

  function isConnected(provider: string): boolean {
    return integrations.some((i) => i.provider === provider);
  }

  function getIntegration(provider: string): Integration | undefined {
    return integrations.find((i) => i.provider === provider);
  }

  async function handleConnect(provider: string) {
    setConnecting(provider);

    // In a real implementation, this would redirect to OAuth flow
    // For now, show a message about the feature
    setTimeout(() => {
      alert(
        `OAuth integration with ${provider} would redirect to the provider's authorization page. This feature requires backend OAuth implementation.`,
      );
      setConnecting(null);
    }, 500);
  }

  async function handleDisconnect(provider: string) {
    if (
      !confirm(
        `Are you sure you want to disconnect ${provider}? This will remove all synced data.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    setIntegrations((prev) => prev.filter((i) => i.provider !== provider));

    if (provider === "classroom") {
      await supabase.from("classroom_sync").delete().eq("user_id", user.id);
      setClassroomCourses([]);
    }
  }

  async function toggleCourseSync(courseId: string, enabled: boolean) {
    const supabase = createClient();

    await supabase
      .from("classroom_sync")
      .update({ sync_enabled: enabled })
      .eq("id", courseId);

    setClassroomCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, sync_enabled: enabled } : c,
      ),
    );
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
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600">
          Connect external services to enhance your experience
        </p>
      </div>

      {/* Connected Services Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Connected Services</p>
                <p className="text-sm text-slate-500">
                  {integrations.length} of {AVAILABLE_INTEGRATIONS.length}{" "}
                  services connected
                </p>
              </div>
            </div>
            {integrations.length === AVAILABLE_INTEGRATIONS.length && (
              <Badge variant="success">All Connected</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <div className="space-y-4">
        {AVAILABLE_INTEGRATIONS.map((integration) => {
          const connected = isConnected(integration.provider);
          const data = getIntegration(integration.provider);

          return (
            <Card key={integration.provider}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">{integration.icon}</div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {integration.name}
                      </h3>
                      {connected && <Badge variant="success">Connected</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      {integration.description}
                    </p>

                    {/* Connected Account Info */}
                    {connected && data && (
                      <div className="p-3 bg-slate-50 rounded-lg mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            {data.email && (
                              <p className="text-slate-700">
                                <span className="text-slate-500">Account:</span>{" "}
                                {data.email}
                              </p>
                            )}
                            <p className="text-slate-500">
                              Connected{" "}
                              {new Date(data.connected_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scopes */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {integration.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(integration.provider)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration.provider)}
                        disabled={connecting === integration.provider}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {connecting === integration.provider
                          ? "Connecting..."
                          : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Google Classroom Courses */}
      {isConnected("classroom") && classroomCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Classroom Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classroomCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                >
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {course.course_name || course.course_id}
                    </h4>
                    {course.last_synced_at && (
                      <p className="text-sm text-slate-500">
                        Last synced:{" "}
                        {new Date(course.last_synced_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-slate-600">Sync enabled</span>
                    <input
                      type="checkbox"
                      checked={course.sync_enabled}
                      onChange={(e) =>
                        toggleCourseSync(course.id, e.target.checked)
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">
                About Integrations
              </h4>
              <p className="text-sm text-slate-600">
                Connecting external services allows MathPivot to automatically
                sync your calendar, create video meeting links, and import
                student data. Your data is encrypted and you can disconnect any
                service at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
