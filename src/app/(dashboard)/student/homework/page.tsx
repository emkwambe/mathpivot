import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudentHomeworkPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get homework items for this student through their sessions
  const { data: homework } = await supabase
    .from("homework_items")
    .select(
      `
      id,
      title,
      description,
      due_date,
      status,
      submission_text,
      submitted_at,
      review_notes,
      reviewed_at,
      session:session_id (
        id,
        booking:booking_id (
          student_user_id,
          start_at,
          tutor_user_id
        )
      )
    `,
    )
    .order("due_date", { ascending: true });

  // Filter homework for this student
  const studentHomework =
    homework?.filter((item) => {
      const session = Array.isArray(item.session)
        ? item.session[0]
        : item.session;
      const booking = session?.booking;
      const bookingData = Array.isArray(booking) ? booking[0] : booking;
      return bookingData?.student_user_id === user.id;
    }) || [];

  const pendingHomework = studentHomework.filter(
    (h) => h.status === "assigned" || h.status === "in_progress",
  );
  const completedHomework = studentHomework.filter(
    (h) => h.status === "completed" || h.status === "reviewed",
  );

  const statusColors: Record<string, string> = {
    assigned: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    reviewed: "bg-purple-100 text-purple-800",
  };

  const statusLabels: Record<string, string> = {
    assigned: "To Do",
    in_progress: "In Progress",
    completed: "Submitted",
    reviewed: "Reviewed",
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed" || status === "reviewed")
      return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Homework</h1>
        <p className="text-slate-600">Track and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-yellow-600">
            {pendingHomework.length}
          </p>
          <p className="text-sm text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-green-600">
            {completedHomework.length}
          </p>
          <p className="text-sm text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-red-600">
            {
              pendingHomework.filter((h) => isOverdue(h.due_date, h.status))
                .length
            }
          </p>
          <p className="text-sm text-slate-500">Overdue</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-slate-900">
            {studentHomework.length}
          </p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
      </div>

      {/* Pending Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Pending Assignments
        </h2>
        {pendingHomework.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-slate-600">
              All caught up! No pending homework.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingHomework.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 ${
                  isOverdue(item.due_date, item.status)
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">
                        {item.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                      {isOverdue(item.due_date, item.status) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 mb-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Due: {formatDate(item.due_date)}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Completed</h2>
        {completedHomework.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No completed assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedHomework.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">
                        {item.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Submitted:{" "}
                      {item.submitted_at
                        ? formatDate(item.submitted_at)
                        : "N/A"}
                    </p>
                    {item.review_notes && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs font-medium text-purple-800">
                          Coach Feedback:
                        </p>
                        <p className="text-sm text-purple-700">
                          {item.review_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
