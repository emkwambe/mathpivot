import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';

type CompetitionFormat = 'individual' | 'team' | 'mixed';

const FORMAT_LABELS: Record<CompetitionFormat, string> = {
  individual: 'Individual',
  team: 'Team',
  mixed: 'Mixed',
};

const FORMAT_ICONS: Record<CompetitionFormat, React.ReactNode> = {
  individual: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  team: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  mixed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

export default async function CompetitionsAdminPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  // Get competition programs with their competition details
  const { data: competitionPrograms } = await supabase
    .from('programs')
    .select(`
      *,
      competitions(*),
      career_pathways(name)
    `)
    .eq('program_type', 'competition')
    .order('start_date', { ascending: false });

  // Get all competitions
  const { data: competitions } = await supabase
    .from('competitions')
    .select(`
      *,
      program:programs(name, start_date, status),
      teams:competition_teams(count),
      results:competition_results(count)
    `);

  // Stats
  const activeCompetitions = competitionPrograms?.filter(p =>
    ['registration_open', 'in_progress'].includes(p.status)
  ).length || 0;

  const totalParticipants = competitions?.reduce((acc, c) => {
    const resultsCount = (c.results as unknown as { count: number }[])?.[0]?.count || 0;
    return acc + resultsCount;
  }, 0) || 0;

  const totalTeams = competitions?.reduce((acc, c) => {
    const teamsCount = (c.teams as unknown as { count: number }[])?.[0]?.count || 0;
    return acc + teamsCount;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Competitions</h1>
          <p className="text-slate-600">Manage math competitions, teams, and results</p>
        </div>
        <Link
          href="/admin/programs/new?type=competition"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Competition
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Competitions</p>
                <p className="text-3xl font-bold text-slate-900">{competitionPrograms?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm text-slate-600">Active Now</p>
                <p className="text-3xl font-bold text-emerald-600">{activeCompetitions}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Teams</p>
                <p className="text-3xl font-bold text-blue-600">{totalTeams}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Participants</p>
                <p className="text-3xl font-bold text-purple-600">{totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          {competitionPrograms && competitionPrograms.length > 0 ? (
            <div className="space-y-4">
              {competitionPrograms.map((program) => {
                const competition = (program.competitions as unknown[])?.[0] as {
                  format: CompetitionFormat;
                  num_rounds: number;
                  time_limit_minutes: number;
                  max_score: number;
                  prizes: { place: number; prize: string }[];
                } | undefined;
                const pathway = program.career_pathways as { name: string } | null;

                return (
                  <Link
                    key={program.id}
                    href={`/admin/competitions/${program.id}`}
                    className="block p-4 border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            🏆
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{program.name}</h3>
                            {pathway && (
                              <p className="text-sm text-slate-500">{pathway.name}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          {program.start_date && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(program.start_date)}
                            </span>
                          )}
                          {competition && (
                            <>
                              <span className="inline-flex items-center gap-1">
                                {FORMAT_ICONS[competition.format]}
                                {FORMAT_LABELS[competition.format]}
                              </span>
                              <span>{competition.num_rounds} rounds</span>
                              {competition.time_limit_minutes && (
                                <span>{competition.time_limit_minutes} min</span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Prizes Preview */}
                        {competition?.prizes && competition.prizes.length > 0 && (
                          <div className="flex gap-2">
                            {competition.prizes.slice(0, 3).map((prize, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  i === 0 ? 'bg-amber-100 text-amber-700' :
                                  i === 1 ? 'bg-slate-100 text-slate-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {prize.place === 1 ? '🥇' : prize.place === 2 ? '🥈' : '🥉'} {prize.prize}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            program.status === 'in_progress' ? 'success' :
                            program.status === 'registration_open' ? 'info' :
                            program.status === 'completed' ? 'secondary' :
                            'warning'
                          }
                        >
                          {program.status.replace('_', ' ')}
                        </Badge>
                        {program.price_cents > 0 && (
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(program.price_cents)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Competitions Yet</h3>
              <p className="text-slate-500 mb-4">Create your first competition to engage students.</p>
              <Link
                href="/admin/programs/new?type=competition"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Competition
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competition Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {FORMAT_ICONS.individual}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Individual</h4>
            <p className="text-sm text-slate-500">Solo competition where each student competes independently</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              {FORMAT_ICONS.team}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Team</h4>
            <p className="text-sm text-slate-500">Teams compete together, combining their scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600">
              {FORMAT_ICONS.mixed}
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Mixed</h4>
            <p className="text-sm text-slate-500">Combination of individual and team rounds</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
