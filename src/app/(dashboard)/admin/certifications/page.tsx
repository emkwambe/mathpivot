import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

type CertLevel = 'foundation' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'expert';
type CertType = 'skill_mastery' | 'career_pathway' | 'competition_prep' | 'tutor_qualification' | 'course_completion' | 'external_validated';

const LEVEL_COLORS: Record<CertLevel, string> = {
  foundation: 'bg-slate-100 text-slate-700',
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-slate-200 text-slate-700',
  gold: 'bg-amber-100 text-amber-700',
  platinum: 'bg-blue-100 text-blue-700',
  expert: 'bg-purple-100 text-purple-700',
};

const LEVEL_ICONS: Record<CertLevel, string> = {
  foundation: '📚',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  expert: '🏆',
};

const TYPE_LABELS: Record<CertType, string> = {
  skill_mastery: 'Skill Mastery',
  career_pathway: 'Career Pathway',
  competition_prep: 'Competition Prep',
  tutor_qualification: 'Tutor Qualification',
  course_completion: 'Course Completion',
  external_validated: 'External Validated',
};

export default async function CertificationsAdminPage() {
  await requireRole('admin');
  const supabase = await createClient();

  // Get all certification programs
  const { data: certifications } = await supabase
    .from('certification_programs')
    .select('*')
    .order('display_order', { ascending: true });

  // Get counts
  const { data: issuedCerts } = await supabase
    .from('user_certifications')
    .select('program_id, status');

  const { data: inProgressCerts } = await supabase
    .from('user_certification_progress')
    .select('program_id, status')
    .neq('status', 'completed');

  // Calculate stats
  const totalIssued = issuedCerts?.filter(c => c.status === 'active').length || 0;
  const totalInProgress = inProgressCerts?.length || 0;
  const activeCerts = certifications?.filter(c => c.is_active).length || 0;

  // Group certifications by category
  type Certification = NonNullable<typeof certifications>[number];
  const certsByCategory = (certifications || []).reduce((acc, cert) => {
    const category = cert.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cert);
    return acc;
  }, {} as Record<string, Certification[]>);

  // Count issued per program
  const issuedByProgram = (issuedCerts || []).reduce((acc, c) => {
    if (c.status === 'active') {
      acc[c.program_id] = (acc[c.program_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certifications</h1>
          <p className="text-slate-600">Manage certification programs and credentials</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/certifications/assessments"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
          >
            Assessments
          </Link>
          <Link
            href="/admin/certifications/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Certification
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Programs</p>
                <p className="text-3xl font-bold text-slate-900">{certifications?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Programs</p>
                <p className="text-3xl font-bold text-emerald-600">{activeCerts}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Certificates Issued</p>
                <p className="text-3xl font-bold text-amber-600">{totalIssued}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-600">{totalInProgress}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certification Levels Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-700">Levels:</span>
            {Object.entries(LEVEL_ICONS).map(([level, icon]) => (
              <span
                key={level}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${LEVEL_COLORS[level as CertLevel]}`}
              >
                {icon} {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications by Category */}
      {(Object.entries(certsByCategory) as [string, Certification[]][]).map(([category, certs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs?.map((cert) => {
                const issued = issuedByProgram[cert.id] || 0;

                return (
                  <Link
                    key={cert.id}
                    href={`/admin/certifications/${cert.id}`}
                    className="block p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl">
                        {cert.badge_image_url ? (
                          <img src={cert.badge_image_url} alt="" className="w-8 h-8" />
                        ) : (
                          LEVEL_ICONS[cert.level as CertLevel] || '🎓'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">{cert.name}</h4>
                          {!cert.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {cert.is_featured && (
                            <Badge variant="warning">Featured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                          {cert.short_description || cert.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-0.5 rounded font-medium ${LEVEL_COLORS[cert.level as CertLevel]}`}>
                            {cert.level}
                          </span>
                          <span className="text-slate-500">
                            {TYPE_LABELS[cert.cert_type as CertType] || cert.cert_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {cert.estimated_hours && (
                          <span className="text-slate-500">~{cert.estimated_hours}h</span>
                        )}
                        {cert.difficulty_rating && (
                          <span className="text-slate-500">
                            {'⭐'.repeat(cert.difficulty_rating)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">{issued} issued</span>
                        {cert.is_free ? (
                          <Badge variant="success">Free</Badge>
                        ) : cert.price_cents > 0 && (
                          <span className="font-medium text-slate-900">
                            {formatCurrency(cert.price_cents)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {(!certifications || certifications.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Certifications Yet</h3>
              <p className="text-slate-500 mb-4">Create certification programs to recognize student achievements.</p>
              <Link
                href="/admin/certifications/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Certification
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/certifications/issued"
          className="block p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-emerald-900">View Issued Certificates</h4>
              <p className="text-sm text-emerald-600">Browse all awarded credentials</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/certifications/pending"
          className="block p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-amber-900">Pending Reviews</h4>
              <p className="text-sm text-amber-600">Manual grading and approvals</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/certifications/assessments"
          className="block p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Manage Assessments</h4>
              <p className="text-sm text-blue-600">Question banks and quizzes</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
