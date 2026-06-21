import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get student profile
  const { data: studentProfile } = await supabase
    .from("students_profile")
    .select("grade_level, course_track")
    .eq("user_id", user.id)
    .single();

  // Get all mastery levels
  const { data: masteryData } = await supabase
    .from("student_skill_mastery")
    .select(
      `
      mastery_level,
      last_practiced_at,
      skill:skills(id, name, category, description)
    `,
    )
    .eq("student_user_id", user.id)
    .order("last_practiced_at", { ascending: false });

  // Group by category
  const skillsByCategory: Record<string, typeof masteryData> = {};
  masteryData?.forEach((item) => {
    const skill = item.skill as unknown as {
      id: string;
      name: string;
      category: string;
      description: string | null;
    } | null;
    const category = skill?.category || "Other";
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(item);
  });

  const masteryLevelInfo: Record<
    string,
    { color: string; bg: string; label: string; progress: number }
  > = {
    not_started: {
      color: "text-slate-600",
      bg: "bg-slate-200",
      label: "Not Started",
      progress: 0,
    },
    developing: {
      color: "text-amber-700",
      bg: "bg-amber-400",
      label: "Developing",
      progress: 33,
    },
    proficient: {
      color: "text-sky-700",
      bg: "bg-sky-400",
      label: "Proficient",
      progress: 66,
    },
    mastered: {
      color: "text-green-700",
      bg: "bg-green-400",
      label: "Mastered",
      progress: 100,
    },
  };

  // Calculate overall stats
  const totalSkills = masteryData?.length || 0;
  const masteredCount =
    masteryData?.filter((m) => m.mastery_level === "mastered").length || 0;
  const proficientCount =
    masteryData?.filter((m) => m.mastery_level === "proficient").length || 0;
  const developingCount =
    masteryData?.filter((m) => m.mastery_level === "developing").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Progress</h1>
        <p className="text-slate-600">
          Track your math skills and mastery levels
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{totalSkills}</p>
            <p className="text-sm text-slate-600">Skills Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-sm text-slate-600">Mastered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-sky-600">{proficientCount}</p>
            <p className="text-sm text-slate-600">Proficient</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {developingCount}
            </p>
            <p className="text-sm text-slate-600">Developing</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(masteryLevelInfo).map(([key, info]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${info.bg}`} />
            <span className="text-slate-600">{info.label}</span>
          </div>
        ))}
      </div>

      {/* Skills by Category */}
      {Object.keys(skillsByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skills?.map((item) => {
                    const skill = item.skill as unknown as {
                      id: string;
                      name: string;
                      category: string;
                      description: string | null;
                    } | null;
                    const levelInfo =
                      masteryLevelInfo[item.mastery_level] ||
                      masteryLevelInfo.not_started;

                    return (
                      <div key={skill?.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {skill?.name}
                            </p>
                            {skill?.description && (
                              <p className="text-sm text-slate-500">
                                {skill.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={`${levelInfo.bg} ${levelInfo.color}`}
                          >
                            {levelInfo.label}
                          </Badge>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${levelInfo.bg} transition-all duration-500`}
                            style={{ width: `${levelInfo.progress}%` }}
                          />
                        </div>
                        {item.last_practiced_at && (
                          <p className="text-xs text-slate-400">
                            Last updated:{" "}
                            {formatDate(item.last_practiced_at, "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No progress tracked yet
            </h3>
            <p className="text-slate-500">
              Your math coach will track your skill progress during sessions.
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Keep working hard and you&apos;ll see your progress here!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
