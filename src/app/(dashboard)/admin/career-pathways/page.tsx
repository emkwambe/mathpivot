import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

const PATHWAY_ICONS: Record<string, string> = {
  actuarial: '📊',
  data_science: '🤖',
  epidemiology: '🔬',
  robotics: '🤖',
  financial_math: '💰',
  competition_math: '🏆',
};

const PATHWAY_COLORS: Record<string, string> = {
  actuarial: 'bg-blue-100 text-blue-700 border-blue-200',
  data_science: 'bg-purple-100 text-purple-700 border-purple-200',
  epidemiology: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  robotics: 'bg-orange-100 text-orange-700 border-orange-200',
  financial_math: 'bg-amber-100 text-amber-700 border-amber-200',
  competition_math: 'bg-red-100 text-red-700 border-red-200',
};

export default async function CareerPathwaysPage() {
  await requireRole('admin');
  const supabase = await createClient();

  // Get all career pathways with related programs count
  const { data: pathways } = await supabase
    .from('career_pathways')
    .select('*')
    .order('order_index', { ascending: true });

  // Get program counts per pathway
  const { data: programs } = await supabase
    .from('programs')
    .select('career_pathway_id')
    .not('career_pathway_id', 'is', null);

  const programCountByPathway = (programs || []).reduce((acc, p) => {
    acc[p.career_pathway_id] = (acc[p.career_pathway_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get certification counts per pathway
  const { data: certifications } = await supabase
    .from('certification_programs')
    .select('category')
    .eq('is_active', true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Career Pathways</h1>
          <p className="text-slate-600">Manage math career tracks and learning paths</p>
        </div>
        <Link
          href="/admin/career-pathways/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Pathway
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Pathways</p>
                <p className="text-3xl font-bold text-slate-900">{pathways?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Pathways</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {pathways?.filter(p => p.is_active).length || 0}
                </p>
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
                <p className="text-sm text-slate-600">Related Programs</p>
                <p className="text-3xl font-bold text-purple-600">{programs?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Pathways Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Career Pathways</CardTitle>
        </CardHeader>
        <CardContent>
          {pathways && pathways.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pathways.map((pathway) => {
                const icon = PATHWAY_ICONS[pathway.code] || '📚';
                const colorClass = PATHWAY_COLORS[pathway.code] || 'bg-slate-100 text-slate-700 border-slate-200';
                const programCount = programCountByPathway[pathway.id] || 0;

                return (
                  <Link
                    key={pathway.id}
                    href={`/admin/career-pathways/${pathway.id}`}
                    className={`block p-5 rounded-xl border-2 hover:shadow-lg transition-all ${colorClass}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{pathway.name}</h3>
                          {!pathway.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-80 line-clamp-2 mb-3">
                          {pathway.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {programCount} programs
                          </span>
                          {pathway.target_grades && pathway.target_grades.length > 0 && (
                            <span>
                              Grades {Math.min(...pathway.target_grades)}-{Math.max(...pathway.target_grades)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Career Outcomes Preview */}
                    {pathway.career_outcomes && pathway.career_outcomes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-current/20">
                        <p className="text-xs font-medium uppercase tracking-wide opacity-60 mb-2">Career Outcomes</p>
                        <div className="flex flex-wrap gap-1">
                          {pathway.career_outcomes.slice(0, 3).map((outcome: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white/50 rounded text-xs">
                              {outcome}
                            </span>
                          ))}
                          {pathway.career_outcomes.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/50 rounded text-xs">
                              +{pathway.career_outcomes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Career Pathways</h3>
              <p className="text-slate-500 mb-4">Create your first career pathway to guide students.</p>
              <Link
                href="/admin/career-pathways/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Pathway
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Pathways */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Pathways to Add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: 'actuarial', name: 'Actuarial Science', desc: 'Risk assessment and insurance mathematics' },
              { code: 'data_science', name: 'Data Science', desc: 'Statistics, ML, and data analysis' },
              { code: 'financial_math', name: 'Financial Mathematics', desc: 'Quantitative finance and trading' },
              { code: 'competition_math', name: 'Competition Math', desc: 'AMC, MATHCOUNTS, Olympiad prep' },
              { code: 'robotics', name: 'Robotics & Engineering', desc: 'Applied math for robotics' },
              { code: 'epidemiology', name: 'Epidemiology', desc: 'Mathematical modeling in health' },
            ].filter(s => !pathways?.some(p => p.code === s.code)).map((suggestion) => (
              <div
                key={suggestion.code}
                className="p-4 border border-dashed border-slate-300 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <div className="text-3xl mb-2">{PATHWAY_ICONS[suggestion.code] || '📚'}</div>
                <h4 className="font-medium text-slate-900">{suggestion.name}</h4>
                <p className="text-sm text-slate-500 mb-3">{suggestion.desc}</p>
                <Link
                  href={`/admin/career-pathways/new?code=${suggestion.code}`}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Create this pathway
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
