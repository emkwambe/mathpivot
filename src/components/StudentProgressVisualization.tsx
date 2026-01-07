'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { MasteryLevel, CourseTrack } from '@/types/database';

interface SkillMastery {
  id: string;
  mastery_level: MasteryLevel;
  last_practiced_at: string | null;
  skills: {
    code: string;
    name: string;
    category: string | null;
    course_track: CourseTrack;
  };
}

interface Diagnostic {
  id: string;
  administered_at: string;
  course_track: CourseTrack;
  score: number | null;
  max_score: number | null;
}

interface StudentProgressVisualizationProps {
  masteryData: SkillMastery[];
  diagnostics: Diagnostic[];
  studentName: string;
}

const MASTERY_CONFIG = {
  mastered: { label: 'Mastered', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', weight: 100 },
  proficient: { label: 'Proficient', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', weight: 75 },
  developing: { label: 'Developing', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700', weight: 50 },
  not_started: { label: 'Not Started', color: 'bg-slate-300', bgColor: 'bg-slate-50', textColor: 'text-slate-600', weight: 0 },
};

export function StudentProgressVisualization({
  masteryData,
  diagnostics,
  studentName
}: StudentProgressVisualizationProps) {
  // Calculate overall progress score (0-100)
  const calculateOverallProgress = () => {
    if (!masteryData.length) return 0;
    const totalWeight = masteryData.reduce((sum, m) => {
      return sum + MASTERY_CONFIG[m.mastery_level].weight;
    }, 0);
    return Math.round(totalWeight / masteryData.length);
  };

  // Group skills by category
  const skillsByCategory = masteryData.reduce((acc, m) => {
    const category = m.skills.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(m);
    return acc;
  }, {} as Record<string, SkillMastery[]>);

  // Calculate category progress
  const getCategoryProgress = (skills: SkillMastery[]) => {
    if (!skills.length) return 0;
    const totalWeight = skills.reduce((sum, m) => sum + MASTERY_CONFIG[m.mastery_level].weight, 0);
    return Math.round(totalWeight / skills.length);
  };

  // Get mastery distribution
  const masteryDistribution = {
    mastered: masteryData.filter(m => m.mastery_level === 'mastered').length,
    proficient: masteryData.filter(m => m.mastery_level === 'proficient').length,
    developing: masteryData.filter(m => m.mastery_level === 'developing').length,
    not_started: masteryData.filter(m => m.mastery_level === 'not_started').length,
  };

  // Get recent activity (skills practiced in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = masteryData
    .filter(m => m.last_practiced_at && new Date(m.last_practiced_at) > thirtyDaysAgo)
    .sort((a, b) => {
      if (!a.last_practiced_at || !b.last_practiced_at) return 0;
      return new Date(b.last_practiced_at).getTime() - new Date(a.last_practiced_at).getTime();
    })
    .slice(0, 8);

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overall Progress Ring */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Circular Progress Indicator */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-100"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  className="text-blue-500"
                  strokeDasharray={`${(overallProgress / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-slate-900">{overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Mastery Distribution */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {(['mastered', 'proficient', 'developing', 'not_started'] as const).map(level => {
                const config = MASTERY_CONFIG[level];
                const count = masteryDistribution[level];
                const percentage = masteryData.length > 0
                  ? Math.round((count / masteryData.length) * 100)
                  : 0;

                return (
                  <div key={level} className={`p-3 rounded-lg ${config.bgColor}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                      <span className={`text-lg font-bold ${config.textColor}`}>{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(skillsByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([category, skills]) => {
                const progress = getCategoryProgress(skills);
                const masteredCount = skills.filter(s => s.mastery_level === 'mastered').length;
                const proficientCount = skills.filter(s => s.mastery_level === 'proficient').length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{category}</span>
                      <span className="text-sm text-slate-500">
                        {masteredCount + proficientCount}/{skills.length} skills proficient+
                      </span>
                    </div>
                    {/* Stacked Progress Bar */}
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      {skills.filter(s => s.mastery_level === 'mastered').length > 0 && (
                        <div
                          className="bg-emerald-500 transition-all duration-500"
                          style={{ width: `${(masteredCount / skills.length) * 100}%` }}
                        />
                      )}
                      {skills.filter(s => s.mastery_level === 'proficient').length > 0 && (
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ width: `${(proficientCount / skills.length) * 100}%` }}
                        />
                      )}
                      {skills.filter(s => s.mastery_level === 'developing').length > 0 && (
                        <div
                          className="bg-amber-500 transition-all duration-500"
                          style={{ width: `${(skills.filter(s => s.mastery_level === 'developing').length / skills.length) * 100}%` }}
                        />
                      )}
                    </div>
                    {/* Skill Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.slice(0, 6).map((skill) => {
                        const config = MASTERY_CONFIG[skill.mastery_level];
                        return (
                          <span
                            key={skill.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
                          >
                            {skill.skills.name}
                          </span>
                        );
                      })}
                      {skills.length > 6 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          +{skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No skill data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const config = MASTERY_CONFIG[activity.mastery_level];
                  return (
                    <div key={activity.id} className="relative flex items-start gap-4 pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${config.color} ring-4 ring-white`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 text-sm">{activity.skills.name}</span>
                          <Badge variant={
                            activity.mastery_level === 'mastered' ? 'success' :
                            activity.mastery_level === 'proficient' ? 'info' :
                            activity.mastery_level === 'developing' ? 'warning' : 'secondary'
                          }>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.last_practiced_at && formatRelativeTime(activity.last_practiced_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No recent activity in the last 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Trend */}
      {diagnostics && diagnostics.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Diagnostic Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Simple bar chart for diagnostic scores */}
              <div className="flex items-end gap-2 h-32">
                {diagnostics.slice(0, 6).reverse().map((diag, index) => {
                  const percentage = diag.score && diag.max_score
                    ? Math.round((diag.score / diag.max_score) * 100)
                    : 0;
                  const isLatest = index === diagnostics.slice(0, 6).length - 1;

                  return (
                    <div key={diag.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-slate-600">{percentage}%</span>
                      <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '100px' }}>
                        <div
                          className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-500 ${
                            isLatest ? 'bg-blue-500' : 'bg-blue-300'
                          }`}
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 truncate w-full text-center">
                        {formatDate(diag.administered_at, 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-300 rounded" />
                  Previous
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded" />
                  Latest
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Mastery Grid (Detailed View) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">All Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {masteryData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {masteryData.map((skill) => {
                const config = MASTERY_CONFIG[skill.mastery_level];
                return (
                  <div
                    key={skill.id}
                    className={`p-2.5 rounded-lg border-2 ${
                      skill.mastery_level === 'mastered' ? 'border-emerald-200 bg-emerald-50' :
                      skill.mastery_level === 'proficient' ? 'border-blue-200 bg-blue-50' :
                      skill.mastery_level === 'developing' ? 'border-amber-200 bg-amber-50' :
                      'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${config.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{skill.skills.name}</p>
                        <p className="text-xs text-slate-500">{skill.skills.code}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No skills tracked yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
