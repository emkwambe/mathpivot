import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';

type ProgramType = 'clinic' | 'workshop' | 'camp' | 'bootcamp' | 'competition' | 'hackathon';
type ProgramStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'canceled';

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  clinic: 'Clinic',
  workshop: 'Workshop',
  camp: 'Camp',
  bootcamp: 'Bootcamp',
  competition: 'Competition',
  hackathon: 'Hackathon',
};

const STATUS_COLORS: Record<ProgramStatus, 'secondary' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'secondary',
  published: 'info',
  registration_open: 'success',
  registration_closed: 'warning',
  in_progress: 'info',
  completed: 'secondary',
  canceled: 'danger',
};

export default async function ProgramsAdminPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  // Get all programs with registration counts
  const { data: programs } = await supabase
    .from('programs')
    .select(`
      *,
      career_pathways(name),
      lead_instructor:users_profile!programs_lead_instructor_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  // Get registration counts per program
  const programIds = programs?.map(p => p.id) || [];
  const { data: registrationCounts } = await supabase
    .from('program_registrations')
    .select('program_id')
    .in('program_id', programIds.length > 0 ? programIds : ['']);

  const countByProgram = (registrationCounts || []).reduce((acc, r) => {
    acc[r.program_id] = (acc[r.program_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get stats
  const activePrograms = programs?.filter(p => ['published', 'registration_open', 'in_progress'].includes(p.status)).length || 0;
  const upcomingPrograms = programs?.filter(p => p.start_date && new Date(p.start_date) > new Date()).length || 0;
  const totalRegistrations = registrationCounts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programs & Camps</h1>
          <p className="text-slate-600">Manage clinics, workshops, camps, and competitions</p>
        </div>
        <Link
          href="/admin/programs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Program
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Programs</p>
                <p className="text-3xl font-bold text-slate-900">{programs?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-3xl font-bold text-emerald-600">{activePrograms}</p>
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
                <p className="text-sm text-slate-600">Upcoming</p>
                <p className="text-3xl font-bold text-amber-600">{upcomingPrograms}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Registrations</p>
                <p className="text-3xl font-bold text-purple-600">{totalRegistrations}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/programs" className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-sm font-medium">
          All
        </Link>
        {Object.entries(PROGRAM_TYPE_LABELS).map(([type, label]) => (
          <Link
            key={type}
            href={`/admin/programs?type=${type}`}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => {
                const pathway = program.career_pathways as { name: string } | null;
                const instructor = program.lead_instructor as { full_name: string } | null;
                const registrations = countByProgram[program.id] || 0;
                const spotsLeft = program.max_participants ? program.max_participants - registrations : null;

                return (
                  <Link
                    key={program.id}
                    href={`/admin/programs/${program.id}`}
                    className="block p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{program.name}</h3>
                          {program.featured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="secondary">
                              {PROGRAM_TYPE_LABELS[program.program_type as ProgramType] || program.program_type}
                            </Badge>
                          </span>
                          {pathway && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {pathway.name}
                            </span>
                          )}
                          {instructor && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {instructor.full_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {program.start_date && (
                            <span className="text-slate-600">
                              {formatDate(program.start_date)}
                              {program.end_date && program.end_date !== program.start_date && (
                                <> - {formatDate(program.end_date)}</>
                              )}
                            </span>
                          )}
                          {program.price_cents > 0 && (
                            <span className="font-medium text-slate-900">
                              {formatCurrency(program.price_cents)}
                              {program.early_bird_price_cents && program.early_bird_price_cents < program.price_cents && (
                                <span className="text-emerald-600 ml-1">
                                  (Early bird: {formatCurrency(program.early_bird_price_cents)})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={STATUS_COLORS[program.status as ProgramStatus] || 'secondary'}>
                          {program.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{registrations} registered</p>
                          {spotsLeft !== null && (
                            <p className={`text-xs ${spotsLeft <= 5 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Programs Yet</h3>
              <p className="text-slate-500 mb-4">Create your first program to get started.</p>
              <Link
                href="/admin/programs/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Program
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
