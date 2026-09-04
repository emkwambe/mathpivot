import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/app/actions/coach-onboarding";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up the application by token to pre-fill signup email.
  const { data: application } = await supabase
    .from("coach_applications")
    .select("email, full_name, status")
    .eq("invite_token", token)
    .maybeSingle();

  if (!application) {
    return (
      <StatusScreen
        title="Invitation not found."
        body="This coach invitation link is not recognized. If you believe this is an error, contact the person who sent you the link."
      />
    );
  }

  if (application.status === "denied" || application.status === "withdrawn") {
    return (
      <StatusScreen
        title="Invitation is no longer active."
        body="This invitation has been withdrawn. Reach out to MathPivot if you have questions."
      />
    );
  }

  // Not signed in — send them to signup, pre-filling email.
  if (!user) {
    const params = new URLSearchParams({
      email: application.email,
      next: `/coach-apply/accept/${token}`,
    });
    redirect(`/signup?${params.toString()}`);
  }

  // Signed in but email mismatch — surface the reason.
  if (user.email?.toLowerCase() !== application.email.toLowerCase()) {
    return (
      <StatusScreen
        title="Signed in as a different email."
        body={`This invitation was sent to ${application.email}. Sign out and sign in with that address to accept.`}
      />
    );
  }

  // Attempt to accept.
  const result = await acceptInvitation(token);
  if (!result.success) {
    return (
      <StatusScreen title="Could not accept invitation." body={result.error} />
    );
  }

  redirect("/tutor/onboarding?welcome=1");
}

function StatusScreen({ title, body }: { title: string; body?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {body && (
          <p className="text-slate-600 mt-3 text-sm leading-relaxed">{body}</p>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-blue-700 hover:underline text-sm"
        >
          Return to MathPivot
        </Link>
      </div>
    </div>
  );
}
