"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/(auth)/actions";

const initial = {
  error: undefined as string | undefined,
  success: undefined as string | undefined,
};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-2">
            <svg
              className="w-7 h-7 text-green-600"
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
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-500">{state.success}</p>
          <Link
            href="/login"
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Sports builds character.
            <br />
            <span className="text-blue-400">MathPivot builds careers.</span>
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Join families who choose structured coaching over hourly tutoring.
            Your child gets a named coach, a mastery-tracked curriculum, and a
            real development pathway.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: "$349", label: "Foundation" },
              { value: "$549", label: "Acceleration" },
              { value: "$799", label: "Advanced" },
            ].map((tier) => (
              <div
                key={tier.label}
                className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700"
              >
                <p className="text-lg font-bold text-white">{tier.value}</p>
                <p className="text-xs text-slate-400">{tier.label}/mo</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Start your child&apos;s math coaching journey
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                I am a...
              </label>
              <select
                id="role"
                name="role"
                defaultValue="parent"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              >
                <option value="parent">Parent / Guardian</option>
                <option value="student">Student</option>
                <option value="tutor">Coach</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="Min. 8 characters"
              />
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {pending ? "Creating account..." : "Create account"}
            </button>

            <p className="text-xs text-center text-slate-400">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400">
                Already a member?
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full text-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
