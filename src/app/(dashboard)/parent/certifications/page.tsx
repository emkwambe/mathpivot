import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { getCertificationPrograms, getCertificationDashboard } from '@/lib/certifications';
import { formatRelativeTime } from '@/lib/utils';

export default async function CertificationsPage() {
  const user = await requireRole(['parent', 'student', 'admin']);

  // Get certification dashboard data
  const dashboardData = await getCertificationDashboard(user.id);

  // Get all available certification programs
  const programs = await getCertificationPrograms({ targetAudience: 'student' });

  // Group programs by category
  const programsByCategory = programs.reduce((acc, program) => {
    const category = program.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(program);
    return acc;
  }, {} as Record<string, typeof programs>);

  const getDifficultyLabel = (rating: number | null) => {
    if (!rating) return 'N/A';
    if (rating <= 2) return 'Beginner';
    if (rating <= 3) return 'Intermediate';
    if (rating <= 4) return 'Advanced';
    return 'Expert';
  };

  const getDifficultyColor = (rating: number | null) => {
    if (!rating) return 'bg-slate-100 text-slate-600';
    if (rating <= 2) return 'bg-green-100 text-green-700';
    if (rating <= 3) return 'bg-blue-100 text-blue-700';
    if (rating <= 4) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Certifications</h1>
            <p className="text-slate-600">Track progress and earn certificates</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold">{dashboardData.earned}</p>
                  <p className="text-emerald-100">Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold">{dashboardData.in_progress}</p>
                  <p className="text-blue-100">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold">{dashboardData.available}</p>
                  <p className="text-purple-100">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earned Certifications */}
        {dashboardData.recent_certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Earned Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.recent_certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="group relative p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        {cert.badge_image_url ? (
                          <img src={cert.badge_image_url} alt="" className="w-8 h-8" />
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{cert.program_name}</h4>
                        <p className="text-sm text-slate-500">
                          Earned {formatRelativeTime(cert.earned_at)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/parent/certifications/${cert.id}`}
                      className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-xl"
                    >
                      <span className="sr-only">View certificate</span>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Progress */}
        {dashboardData.current_progress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.current_progress.map((progress) => (
                  <div
                    key={progress.program_id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{progress.program_name}</h4>
                      <span className="text-sm font-semibold text-blue-600">
                        {progress.completion_percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progress.completion_percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {progress.completion_percentage >= 100 ? 'Ready for certification!' : 'Keep going!'}
                      </span>
                      <Link
                        href={`/parent/certifications/program/${progress.program_id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Certifications by Category */}
        {Object.keys(programsByCategory).length > 0 ? (
          Object.entries(programsByCategory).map(([category, categoryPrograms]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPrograms.map((program) => (
                    <Link
                      key={program.id}
                      href={`/parent/certifications/program/${program.id}`}
                      className="group block p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          {program.badge_image_url ? (
                            <img src={program.badge_image_url} alt="" className="w-6 h-6" />
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {program.name}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {program.short_description || program.description || 'Complete this certification path'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(program.difficulty_rating)}`}>
                          {getDifficultyLabel(program.difficulty_rating)}
                        </span>
                        <Badge variant="secondary">{program.level}</Badge>
                        {program.estimated_hours && (
                          <span className="text-xs text-slate-400">
                            ~{program.estimated_hours}h
                          </span>
                        )}
                        {program.is_free ? (
                          <Badge variant="success">Free</Badge>
                        ) : (
                          <span className="text-xs text-slate-500">
                            ${(program.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Certifications Available</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Certification programs will be available soon. Keep practicing your skills!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
