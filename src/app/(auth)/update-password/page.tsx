"use client";
import { useActionState } from "react";
import { updatePasswordAction } from "@/app/(auth)/actions";

const initial = { error: undefined as string | undefined };

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>

          {state?.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
