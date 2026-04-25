import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

type WaitlistStatus =
  | "waiting"
  | "notified"
  | "booked"
  | "expired"
  | "canceled";

const STATUS_COLORS: Record<
  WaitlistStatus,
  "warning" | "info" | "success" | "secondary" | "danger"
> = {
  waiting: "warning",
  notified: "info",
  booked: "success",
  expired: "secondary",
  canceled: "danger",
};

export default async function AdminWaitlistPage() {
  await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  // Get waitlist entries with related data
  const { data: waitlistEntries } = await supabase
    .from("waitlist")
    .select(
      `
      *,
      student:users_profile!waitlist_student_user_id_fkey(id, full_name),
      parent:users_profile!waitlist_parent_user_id_fkey(id, full_name, email),
      tutor:tutors_profile(
        users_profile(full_name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Calculate stats
  const totalEntries = waitlistEntries?.length || 0;
  const waitingCount =
    waitlistEntries?.filter((e) => e.status === "waiting").length || 0;
  const notifiedCount =
    waitlistEntries?.filter((e) => e.status === "notified").length || 0;
  const bookedCount =
    waitlistEntries?.filter((e) => e.status === "booked").length || 0;

  // Group by status for filtering
  const waitingEntries =
    waitlistEntries?.filter((e) => e.status === "waiting") || [];
  const notifiedEntries =
    waitlistEntries?.filter((e) => e.status === "notified") || [];
  const completedEntries =
    waitlistEntries?.filter((e) =>
      ["booked", "expired", "canceled"].includes(e.status),
    ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Waitlist Management
        </h1>
        <p className="text-slate-600">
          Manage session waitlist requests and convert to bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Requests</p>
              <p className="text-3xl font-bold text-slate-900">
                {totalEntries}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Waiting</p>
              <p className="text-3xl font-bold text-amber-600">
                {waitingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Notified</p>
              <p className="text-3xl font-bold text-blue-600">
                {notifiedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Converted</p>
              <p className="text-3xl font-bold text-emerald-600">
                {bookedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waiting Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Waiting for Availability
            {waitingCount > 0 && (
              <Badge variant="warning">{waitingCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitingEntries.length > 0 ? (
            <div className="space-y-4">
              {waitingEntries.map((entry) => {
                const student = entry.student as { full_name: string } | null;
                const parent = entry.parent as {
                  full_name: string;
                  email: string;
                } | null;
                const tutorProfile = entry.tutor as {
                  users_profile: { full_name: string };
                } | null;

                return (
                  <div
                    key={entry.id}
                    className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">
                            {student?.full_name}
                          </h4>
                          <Badge variant="warning">Waiting</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Preferred Date</p>
                            <p className="font-medium text-slate-900">
                              {formatDate(entry.preferred_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Preferred Time</p>
                            <p className="font-medium text-slate-900">
                              {entry.preferred_start_time} -{" "}
                              {entry.preferred_end_time}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Modality</p>
                            <p className="font-medium text-slate-900 capitalize">
                              {entry.modality}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Requested Coach</p>
                            <p className="font-medium text-slate-900">
                              {tutorProfile?.users_profile?.full_name ||
                                "Any available"}
                            </p>
                          </div>
                        </div>

                        {entry.notes && (
                          <p className="text-sm text-slate-600 mt-2 bg-white rounded p-2">
                            {entry.notes}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 mt-2">
                          Parent: {parent?.full_name} ({parent?.email}) •
                          Requested {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">
              No entries currently waiting.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notified Entries */}
      {notifiedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Notified - Awaiting Response
              <Badge variant="info">{notifiedEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifiedEntries.map((entry) => {
                const student = entry.student as { full_name: string } | null;
                const parent = entry.parent as { full_name: string } | null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {student?.full_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatDate(entry.preferred_date)} at{" "}
                        {entry.preferred_start_time}
                      </p>
                      <p className="text-xs text-slate-500">
                        Parent: {parent?.full_name}
                      </p>
                    </div>
                    <Badge variant="info">Notified</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed/Historical Entries */}
      {completedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Requested Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEntries.slice(0, 20).map((entry) => {
                    const student = entry.student as {
                      full_name: string;
                    } | null;

                    return (
                      <tr key={entry.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-slate-900">
                          {student?.full_name}
                        </td>
                        <td className="py-3 text-slate-600">
                          {formatDate(entry.preferred_date)}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              STATUS_COLORS[entry.status as WaitlistStatus]
                            }
                          >
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-500">
                          {formatDate(entry.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalEntries === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Waitlist Entries
              </h3>
              <p className="text-slate-500">
                When parents request sessions that aren't available, they'll
                appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
