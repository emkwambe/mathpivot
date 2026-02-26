import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export default async function StudentCareerPathwaysPage() {
  const user = await requireRole('student');
  const supabase = await createClient();

  // Get all active career pathways
  const { data: pathways } = await supabase
    .from('career_pathways')
    .select(`
      *,
      programs:programs(id, name, program_type, status)
    `)
    .eq('is_active', true)
    .order('display_order');

  // Get student's pathway recommendations
  const { data: recommendations } = await supabase
    .from('student_pathway_recommendations')
    .select(`
      *,
      pathway:career_pathways(id, name, icon_name)
    `)
    .eq('student_user_id', user.id)
    .order('confidence_score', { ascending: false });

  // Get student's certifications
  const { data: certifications } = await supabase
    .from('user_certifications')
    .select(`
      *,
      certification:certifications(id, name, career_pathway_id)
    `)
    .eq('user_id', user.id);

  // Map certifications to pathways
  const certsByPathway = new Map<string, number>();
  certifications?.forEach(c => {
    const cert = c.certification as { career_pathway_id: string } | null;
    if (cert?.career_pathway_id) {
      certsByPathway.set(cert.career_pathway_id, (certsByPathway.get(cert.career_pathway_id) || 0) + 1);
    }
  });

  // Top recommended pathways
  const topRecommendations = recommendations?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Pathways</h1>
        <p className="text-slate-600">Explore career paths and see how math connects to your future</p>
      </div>

      {/* Personalized Recommendations */}
      {topRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topRecommendations.map((rec, idx) => {
                const pathway = rec.pathway as { id: string; name: string; icon_name: string } | null;
                if (!pathway) return null;

                return (
                  <a
                    key={rec.id}
                    href={`#pathway-${pathway.id}`}
                    className={`block p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      idx === 0 ? 'border-amber-300 bg-amber-50' :
                      idx === 1 ? 'border-slate-300 bg-slate-50' :
                      'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                      <h4 className="font-semibold text-slate-900">{pathway.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(rec.confidence_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {((rec.confidence_score || 0) * 100).toFixed(0)}% match
                      </span>
                    </div>
                    {rec.recommendation_reason && (
                      <p className="text-sm text-slate-600 mt-2">{rec.recommendation_reason}</p>
                    )}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pathways?.map((pathway) => {
          const programs = pathway.programs as { id: string; name: string; program_type: string; status: string }[] | null;
          const activePrograms = programs?.filter(p => p.status !== 'draft') || [];
          const certsEarned = certsByPathway.get(pathway.id) || 0;
          const skills = pathway.skills_taught as string[] | null;
          const careerExamples = pathway.career_examples as string[] | null;

          return (
            <Card key={pathway.id} id={`pathway-${pathway.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      {pathway.icon_name || '📊'}
                    </div>
                    <div>
                      <CardTitle>{pathway.name}</CardTitle>
                      {pathway.tagline && (
                        <p className="text-sm text-slate-500">{pathway.tagline}</p>
                      )}
                    </div>
                  </div>
                  {certsEarned > 0 && (
                    <Badge variant="success">{certsEarned} cert{certsEarned > 1 ? 's' : ''} earned</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pathway.description && (
                  <p className="text-slate-600 mb-4">{pathway.description}</p>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Skills you'll learn:</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 6).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 6 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                          +{skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Career Examples */}
                {careerExamples && careerExamples.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Career opportunities:</p>
                    <p className="text-sm text-slate-600">{careerExamples.slice(0, 4).join(' • ')}</p>
                  </div>
                )}

                {/* Programs */}
                {activePrograms.length > 0 && (
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Available Programs ({activePrograms.length}):
                    </p>
                    <div className="space-y-2">
                      {activePrograms.slice(0, 3).map((program) => (
                        <div
                          key={program.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-700">{program.name}</span>
                          <Badge variant="secondary" className="capitalize">
                            {program.program_type}
                          </Badge>
                        </div>
                      ))}
                      {activePrograms.length > 3 && (
                        <p className="text-xs text-slate-500">
                          +{activePrograms.length - 3} more programs
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Related Certifications Link */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <Link
                    href={`/student/certifications?pathway=${pathway.id}`}
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    View certifications in this pathway
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {(!pathways || pathways.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Career Pathways Coming Soon</h3>
              <p className="text-slate-500">We're preparing exciting career paths for you to explore!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">About Career Pathways</h4>
              <p className="text-sm text-slate-600">
                Career pathways show you how the math skills you're learning connect to real careers.
                Each pathway includes certifications you can earn to demonstrate your expertise.
                Your recommendations are based on your progress, interests, and skills.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
