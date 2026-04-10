'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { captureLeadAction } from '@/app/actions/leads';

const SUBJECTS = [
  'Algebra', 'Geometry', 'Pre-Calculus', 'AP Calculus AB', 'AP Calculus BC',
  'AP Statistics', 'Linear Algebra', 'Discrete Math',
  'Python', 'Data Science', 'Computer Science',
];

export default function GetStartedPage() {
  const [state, formAction, isPending] = useActionState(captureLeadAction, {});

  if (state.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600 mb-6">
            We&apos;ve received your information and will reach out within 24 hours to discuss how MathPivot can help your student excel.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-slate-900">MathPivot</span>
          </Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
            Already a member? Sign in
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left — Value Prop */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Unlock Your Student&apos;s Math Potential
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Expert 1-on-1 tutoring in mathematics and computational sciences.
              From Algebra to AP Calculus, from Python to Data Science.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Free Diagnostic Assessment', desc: 'Understand exactly where your student stands' },
                { title: 'Personalized Learning Path', desc: 'Curriculum tailored to goals and pace' },
                { title: 'Expert Math Tutors', desc: 'Verified specialists in math & CS education' },
                { title: 'AI-Powered Practice', desc: 'Smart homework and skill-building between sessions' },
                { title: 'Progress Tracking', desc: 'Weekly reports with mastery-level insights' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Get Started</h2>
            <p className="text-sm text-slate-500 mb-6">Fill out the form and we&apos;ll reach out within 24 hours.</p>

            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{state.error}</p>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="source" value="website" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text" name="parentName" required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email" name="parentEmail" required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel" name="parentPhone"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text" name="studentName"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select name="studentGrade" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subjects of Interest</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map(subj => (
                    <label key={subj} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-blue-50 hover:border-blue-200 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 has-[:checked]:text-blue-700">
                      <input type="checkbox" name="subjects" value={subj} className="sr-only" />
                      {subj}
                    </label>
                  ))}
                </div>
                <input type="hidden" name="subjectsInterested" id="subjectsInterested" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Format</label>
                <div className="flex gap-3">
                  {['online', 'in_person', 'either'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm">
                      <input type="radio" name="preferredModality" value={opt} defaultChecked={opt === 'either'} className="text-blue-600" />
                      {opt === 'in_person' ? 'In-Person' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goals or Questions</label>
                <textarea
                  name="goals" rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What would you like help with? Any specific goals or concerns?"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Submitting...' : 'Request Free Consultation'}
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                By submitting, you agree to be contacted about MathPivot&apos;s tutoring services.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
