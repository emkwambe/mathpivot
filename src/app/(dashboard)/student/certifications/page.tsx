import { requireRole } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, SortDropdown, type SortOption } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

// Level order for sorting
const levelOrder: Record<string, number> = {
  foundation: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  platinum: 5,
  expert: 6,
};

type CertificationProgram = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  short_description: string | null;
  level: string;
  category: string | null;
  badge_image_url: string | null;
  badge_color: string | null;
  estimated_hours: number | null;
  difficulty_rating: number | null;
  is_active: boolean;
  target_audience: string;
  display_order: number | null;
};

function sortPrograms(programs: CertificationProgram[], sort: SortOption): CertificationProgram[] {
  const sorted = [...programs];

  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'level':
      return sorted.sort((a, b) => (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0));
    case 'level-desc':
      return sorted.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0));
    case 'difficulty':
      return sorted.sort((a, b) => (a.difficulty_rating || 0) - (b.difficulty_rating || 0));
    case 'difficulty-desc':
      return sorted.sort((a, b) => (b.difficulty_rating || 0) - (a.difficulty_rating || 0));
    case 'hours':
      return sorted.sort((a, b) => (a.estimated_hours || 0) - (b.estimated_hours || 0));
    case 'hours-desc':
      return sorted.sort((a, b) => (b.estimated_hours || 0) - (a.estimated_hours || 0));
    default:
      return sorted;
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: SortOption }>;
}

export default async function StudentCertificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'name';
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student's earned certifications
  const { data: earnedCerts } = await supabase
    .from('user_certifications')
    .select(`
      id,
      earned_at,
      certificate_url,
      certification_program:certification_programs (
        id,
        name,
        code,
        description,
        level,
        category,
        badge_image_url,
        badge_color
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  // Get student's certification progress
  const { data: progressData } = await supabase
    .from('user_certification_progress')
    .select(`
      id,
      started_at,
      completion_percentage,
      certification_program:certification_programs (
        id,
        name,
        code,
        description,
        level,
        category,
        badge_image_url,
        estimated_hours
      )
    `)
    .eq('user_id', user.id)
    .lt('completion_percentage', 100)
    .order('completion_percentage', { ascending: false });

  // Get available certification programs
  const { data: availablePrograms } = await supabase
    .from('certification_programs')
    .select('*')
    .eq('is_active', true)
    .eq('target_audience', 'student');

  const earned = earnedCerts || [];
  const inProgress = progressData || [];
  const available = (availablePrograms || []) as CertificationProgram[];

  // Filter out programs that are earned or in progress
  const earnedIds = earned.map(e => (e.certification_program as unknown as { id: string } | null)?.id);
  const inProgressIds = inProgress.map(p => (p.certification_program as unknown as { id: string } | null)?.id);
  const notStarted = available.filter(p => !earnedIds.includes(p.id) && !inProgressIds.includes(p.id));

  // Sort the available programs
  const sortedPrograms = sortPrograms(notStarted, sort);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'foundation': return 'bg-green-100 text-green-700';
      case 'bronze': return 'bg-amber-100 text-amber-700';
      case 'silver': return 'bg-slate-200 text-slate-700';
      case 'gold': return 'bg-yellow-100 text-yellow-700';
      case 'platinum': return 'bg-indigo-100 text-indigo-700';
      case 'expert': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getDifficultyLabel = (rating: number | null) => {
    if (!rating) return null;
    if (rating <= 2) return 'Easy';
    if (rating <= 3) return 'Medium';
    if (rating <= 4) return 'Hard';
    return 'Expert';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Certifications</h1>
          <p className="text-slate-600">Track your progress and earn badges</p>
        </div>
        <SortDropdown currentSort={sort} />
      </div>

      {/* Stats */}
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
                <p className="text-3xl font-bold">{earned.length}</p>
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
                <p className="text-3xl font-bold">{inProgress.length}</p>
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
                <p className="text-3xl font-bold">{notStarted.length}</p>
                <p className="text-purple-100">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Certifications */}
      {earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              My Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earned.map((cert) => {
                const program = cert.certification_program as unknown as { id: string; name: string; badge_image_url: string | null; badge_color: string | null; level: string } | null;
                return (
                  <div
                    key={cert.id}
                    className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: program?.badge_color || '#10B981' }}
                    >
                      {program?.badge_image_url ? (
                        <img src={program.badge_image_url} alt="" className="w-10 h-10" />
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">{program?.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(cert.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
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
              {inProgress.map((progress) => {
                const program = progress.certification_program as unknown as { id: string; name: string; level: string } | null;
                return (
                  <div
                    key={progress.id}
                    className="p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{program?.name}</h4>
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
                    <p className="text-xs text-slate-500 mt-2">
                      {progress.completion_percentage >= 80 ? 'Almost there! Keep going!' : 'Keep practicing to earn this badge!'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Certifications */}
      {sortedPrograms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Available Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPrograms.map((program) => (
                <div
                  key={program.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: program.badge_color || '#3B82F6' }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {program.name}
                      </h4>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {program.short_description || program.description || 'Complete this certification'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getLevelColor(program.level)}`}>
                      {program.level}
                    </span>
                    {getDifficultyLabel(program.difficulty_rating) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {getDifficultyLabel(program.difficulty_rating)}
                      </span>
                    )}
                    {program.estimated_hours && (
                      <span className="text-xs text-slate-400">
                        ~{program.estimated_hours}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : earned.length === 0 && inProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Certifications Yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Keep practicing your skills to unlock certifications and earn badges!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
