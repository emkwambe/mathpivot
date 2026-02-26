import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

type CompetitionFormat = 'individual' | 'team' | 'mixed';

const FORMAT_LABELS: Record<CompetitionFormat, string> = {
  individual: 'Individual',
  team: 'Team',
  mixed: 'Mixed',
};

function getRankBadge(rank: number) {
  if (rank === 1) return { emoji: '🥇', color: 'bg-amber-100 text-amber-800' };
  if (rank === 2) return { emoji: '🥈', color: 'bg-slate-200 text-slate-800' };
  if (rank === 3) return { emoji: '🥉', color: 'bg-orange-100 text-orange-800' };
  return { emoji: `#${rank}`, color: 'bg-blue-100 text-blue-800' };
}

export default async function StudentCompetitionsPage() {
  const user = await requireRole('student');
  const supabase = await createClient();

  // Get student's competition results
  const { data: myResults } = await supabase
    .from('competition_results')
    .select(`
      *,
      competition:competitions(
        id,
        format,
        num_rounds,
        max_score,
        prizes,
        program:programs(id, name, start_date, status)
      ),
      team:competition_teams(id, name)
    `)
    .eq('student_user_id', user.id)
    .order('created_at', { ascending: false });

  // Get teams the student is a member of
  const { data: myTeams } = await supabase
    .from('competition_team_members')
    .select(`
      role,
      team:competition_teams(
        id,
        name,
        competition:competitions(
          id,
          format,
          program:programs(id, name, start_date, status)
        )
      )
    `)
    .eq('student_user_id', user.id);

  // Get available upcoming competitions
  const { data: upcomingCompetitions } = await supabase
    .from('programs')
    .select(`
      *,
      competitions(id, format, num_rounds, time_limit_minutes, prizes),
      career_pathways(name)
    `)
    .eq('program_type', 'competition')
    .in('status', ['published', 'registration_open'])
    .order('start_date', { ascending: true })
    .limit(6);

  // Calculate stats
  const totalCompetitions = new Set(myResults?.map(r => r.competition_id)).size;
  const bestRank = myResults?.reduce((best, r) => r.rank && r.rank < best ? r.rank : best, Infinity) || null;
  const totalScore = myResults?.reduce((sum, r) => sum + (Number(r.score) || 0), 0) || 0;
  const avgPercentile = myResults?.length
    ? myResults.reduce((sum, r) => sum + (Number(r.percentile) || 0), 0) / myResults.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Competitions</h1>
        <p className="text-slate-600">View your competition history and results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Competitions</p>
              <p className="text-3xl font-bold text-slate-900">{totalCompetitions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Best Rank</p>
              <p className="text-3xl font-bold text-amber-600">
                {bestRank && bestRank !== Infinity ? `#${bestRank}` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Points</p>
              <p className="text-3xl font-bold text-blue-600">{totalScore.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Avg Percentile</p>
              <p className="text-3xl font-bold text-emerald-600">
                {avgPercentile > 0 ? `${avgPercentile.toFixed(0)}%` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Results */}
      <Card>
        <CardHeader>
          <CardTitle>My Results</CardTitle>
        </CardHeader>
        <CardContent>
          {myResults && myResults.length > 0 ? (
            <div className="space-y-4">
              {myResults.map((result) => {
                const competition = result.competition as {
                  format: CompetitionFormat;
                  num_rounds: number;
                  max_score: number;
                  prizes: { place: number; prize: string }[];
                  program: { id: string; name: string; start_date: string; status: string };
                } | null;
                const team = result.team as { id: string; name: string } | null;
                const rankInfo = result.rank ? getRankBadge(result.rank) : null;

                return (
                  <div
                    key={result.id}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {rankInfo && (
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${rankInfo.color}`}>
                              {rankInfo.emoji}
                            </span>
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {competition?.program?.name || 'Competition'}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {competition?.program?.start_date && formatDate(competition.program.start_date)}
                              {team && ` • Team: ${team.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {result.score !== null && (
                            <span className="text-slate-700">
                              <span className="font-medium">{result.score}</span>
                              {result.max_possible_score && (
                                <span className="text-slate-500">/{result.max_possible_score}</span>
                              )} points
                            </span>
                          )}
                          {result.percentile && (
                            <span className="text-emerald-600 font-medium">
                              Top {(100 - Number(result.percentile)).toFixed(0)}%
                            </span>
                          )}
                          {result.time_taken_seconds && (
                            <span className="text-slate-500">
                              {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
                            </span>
                          )}
                        </div>

                        {result.feedback && (
                          <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                            {result.feedback}
                          </p>
                        )}
                      </div>

                      <Badge variant={competition?.format === 'team' ? 'info' : 'secondary'}>
                        {competition?.format ? FORMAT_LABELS[competition.format] : 'Competition'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Results Yet</h3>
              <p className="text-slate-500">Join a competition to see your results here!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Teams */}
      {myTeams && myTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTeams.map((membership, idx) => {
                const teamData = membership.team as unknown;
                const team = (Array.isArray(teamData) ? teamData[0] : teamData) as {
                  id: string;
                  name: string;
                  competition: {
                    id: string;
                    format: CompetitionFormat;
                    program: { id: string; name: string; start_date: string; status: string };
                  };
                } | null;

                if (!team) return null;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{team.name}</h4>
                        <p className="text-sm text-slate-500">{team.competition?.program?.name}</p>
                      </div>
                    </div>
                    <Badge variant={membership.role === 'captain' ? 'success' : 'secondary'}>
                      {membership.role === 'captain' ? 'Captain' : 'Member'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Competitions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingCompetitions && upcomingCompetitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingCompetitions.map((program) => {
                const competition = (program.competitions as unknown[])?.[0] as {
                  id: string;
                  format: CompetitionFormat;
                  num_rounds: number;
                  time_limit_minutes: number;
                  prizes: { place: number; prize: string }[];
                } | undefined;
                const pathway = program.career_pathways as { name: string } | null;

                return (
                  <div
                    key={program.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{program.name}</h4>
                        {pathway && (
                          <p className="text-sm text-slate-500">{pathway.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                      {program.start_date && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(program.start_date)}
                        </span>
                      )}
                      {competition && (
                        <Badge variant="secondary">
                          {FORMAT_LABELS[competition.format]}
                        </Badge>
                      )}
                    </div>

                    {/* Prizes preview */}
                    {competition?.prizes && competition.prizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {competition.prizes.slice(0, 3).map((prize, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs"
                          >
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {prize.prize}
                          </span>
                        ))}
                      </div>
                    )}

                    <Badge
                      variant={program.status === 'registration_open' ? 'success' : 'info'}
                      className="w-full justify-center"
                    >
                      {program.status === 'registration_open' ? 'Registration Open' : 'Coming Soon'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No upcoming competitions at the moment.</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon for new competitions!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
