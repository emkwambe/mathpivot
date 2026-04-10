import { createClient } from '@/lib/supabase/server';
import { MathWhiteboard } from '@/components/MathWhiteboard';

export default async function TutorWhiteboardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Whiteboard</h1>
        <p className="text-slate-600">
          Collaborative math whiteboard with handwriting recognition, graphing, and LaTeX support
        </p>
      </div>

      {/* Math Whiteboard Integration */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <MathWhiteboard className="min-h-[600px]" />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
          title="Handwriting Recognition"
          description="Write math equations by hand and have them converted to formatted text"
        />
        <InfoCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="Graph Plotting"
          description="Plot functions and visualize mathematical concepts in real-time"
        />
        <InfoCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Real-Time Collaboration"
          description="Share the whiteboard URL with students for instant collaboration"
        />
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">Tips for Best Experience</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Open the whiteboard in a new tab for full-screen drawing</li>
          <li>• Share the whiteboard URL with your student before the session</li>
          <li>• Use alongside Zoom or Google Meet for voice/video communication</li>
          <li>• Boards are automatically saved - just bookmark the URL to return later</li>
        </ul>
      </div>

      {/* Future Upgrade Notice */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Coming Soon: LiveBoard Integration</h3>
            <p className="text-sm text-indigo-700">
              We&apos;re planning to upgrade to LiveBoard for integrated video conferencing,
              session recording, and advanced classroom features. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
