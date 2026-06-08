"use client";

import Link from "next/link";

const ASSETS = [
  {
    title: "Free Diagnostic Flyer",
    description:
      "8.5×11 printable flyer for schools, libraries, and community boards. Promotes the free math assessment.",
    href: "/flyer",
    cta: "View & Print",
    color: "blue",
  },
  {
    title: "Summer Clinics Page",
    description:
      "Share the summer programs waitlist directly. Includes pricing, EOG/EOC focus areas, and waitlist form.",
    href: "/summer",
    cta: "Copy Link",
    color: "orange",
  },
  {
    title: "Public Diagnostic",
    description:
      "Direct link to the free 15-minute math assessment. Parents enter info and students take the test immediately.",
    href: "/diagnostic",
    cta: "Copy Link",
    color: "emerald",
  },
  {
    title: "Coach Application",
    description:
      "Share with math teachers interested in coaching. Includes compensation details and application form.",
    href: "/careers",
    cta: "Copy Link",
    color: "purple",
  },
];

const SOCIAL_POSTS = [
  {
    platform: "Facebook Parent Groups",
    text: `🎯 Free 15-minute math assessment for your child

MathPivot's diagnostic covers 6 core math domains and tells you exactly where your child is strong — and where they need support.

No cost. No commitment. Results in minutes.

👉 mathpivot.com/diagnostic`,
  },
  {
    platform: "Nextdoor / Community",
    text: `Does your child need math support this summer? MathPivot is running 8-11 day summer math clinics targeting the most heavily tested EOG and EOC topics.

Small groups (5-6 students), named math coach, and clinic fees are 100% credited if you enroll in year-round coaching.

Spots are limited → mathpivot.com/summer`,
  },
  {
    platform: "Teacher / Coach Networks",
    text: `Math teachers: ever wanted to build a coaching practice?

MathPivot is looking for strong math teachers to become certified math coaches. Named student portfolio (5-6 students), structured curriculum, all tools provided.

You could earn up to $5,000/month coaching math.

Apply → mathpivot.com/careers`,
  },
];

export default function SharePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">MathPivot</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            Marketing Toolkit
          </h1>
          <p className="text-slate-600 mt-2">
            Printable flyers, shareable links, and ready-to-post social media
            copy. Everything you need to spread the word about MathPivot.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-4">
            Shareable Assets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ASSETS.map((asset) => (
              <div
                key={asset.title}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <h3 className="font-semibold text-slate-900">{asset.title}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  {asset.description}
                </p>
                <Link
                  href={asset.href}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors"
                >
                  {asset.cta}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-4">
            Ready-to-Post Social Media Copy
          </h2>
          <div className="space-y-4">
            {SOCIAL_POSTS.map((post) => (
              <div
                key={post.platform}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {post.platform}
                  </span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(post.text)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Copy text
                  </button>
                </div>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {post.text}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
