import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function StudentCompetitionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: upcoming } = await supabase
    .from("math_competitions")
    .select("*")
    .in("status", ["upcoming", "registration_open"])
    .order("competition_date", { ascending: true })
    .limit(20);

  const { data: myRegistrations } = await supabase
    .from("competition_registrations")
    .select("competition_id, status")
    .eq("student_id", user.id);

  const regMap = new Map(
    (myRegistrations || []).map((r) => [r.competition_id, r.status]),
  );

  const { data: myResults } = await supabase
    .from("competition_results")
    .select(
      "competition_id, score, max_possible_score, placement, percentile, badge_earned",
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const resultCompIds = [
    ...new Set((myResults || []).map((r) => r.competition_id)),
  ];
  const { data: pastComps } =
    resultCompIds.length > 0
      ? await supabase
          .from("math_competitions")
          .select("id, name, competition_type, competition_date")
          .in("id", resultCompIds)
      : { data: [] };

  const pastCompMap = new Map((pastComps || []).map((c) => [c.id, c]));

  const totalCompetitions = resultCompIds.length;
  const bestPlacement =
    myResults?.reduce(
      (best, r) => (r.placement && r.placement < best ? r.placement : best),
      Infinity,
    ) || Infinity;
  const badgeCount =
    myResults?.filter(
      (r) => r.badge_earned && r.badge_earned !== "participation",
    ).length || 0;

  const typeColors: Record<string, string> = {
    mathathlon: "bg-indigo-100 text-indigo-800",
    external: "bg-slate-100 text-slate-700",
  };

  const badgeColors: Record<string, string> = {
    gold: "bg-yellow-100 text-yellow-800",
    silver: "bg-slate-200 text-slate-700",
    bronze: "bg-amber-100 text-amber-800",
    excellence: "bg-purple-100 text-purple-800",
    participation: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Competitions</h1>
        <p className="text-slate-600 mt-1">
          Mathathlon events and external competitions — compete, grow, and build
          your portfolio.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {totalCompetitions}
          </p>
          <p className="text-xs text-slate-500">Competed</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {bestPlacement !== Infinity ? `#${bestPlacement}` : "—"}
          </p>
          <p className="text-xs text-slate-500">Best Placement</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{badgeCount}</p>
          <p className="text-xs text-slate-500">Badges Earned</p>
        </div>
      </div>

      {myResults && myResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            My Results
          </h2>
          <div className="space-y-3">
            {myResults.map((result, i) => {
              const comp = pastCompMap.get(result.competition_id);
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {comp?.name || "Competition"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {comp?.competition_type && (
                          <Badge
                            className={
                              typeColors[comp.competition_type] ||
                              "bg-slate-100"
                            }
                          >
                            {comp.competition_type === "mathathlon"
                              ? "Mathathlon"
                              : "External"}
                          </Badge>
                        )}
                        {comp?.competition_date && (
                          <span className="text-xs text-slate-400">
                            {formatDate(comp.competition_date, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.score !== null && (
                        <p className="text-lg font-bold text-slate-900">
                          {result.score}/{result.max_possible_score}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {result.placement && (
                          <span className="text-sm text-slate-500">
                            #{result.placement}
                          </span>
                        )}
                        {result.badge_earned && (
                          <Badge
                            className={
                              badgeColors[result.badge_earned] || "bg-slate-100"
                            }
                          >
                            {result.badge_earned}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Upcoming Competitions
      </h2>

      {!upcoming || upcoming.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">
            No upcoming competitions scheduled. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((comp) => {
            const regStatus = regMap.get(comp.id);
            const isRegistered = !!regStatus;

            return (
              <div
                key={comp.id}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {comp.name}
                      </h3>
                      <Badge
                        className={
                          typeColors[comp.competition_type] || "bg-slate-100"
                        }
                      >
                        {comp.competition_type === "mathathlon"
                          ? "Mathathlon"
                          : "External"}
                      </Badge>
                    </div>
                    {comp.description && (
                      <p className="text-sm text-slate-600 mb-2">
                        {comp.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {comp.competition_date && (
                        <span>
                          {formatDate(comp.competition_date, "MMM d, yyyy")}
                        </span>
                      )}
                      {comp.location && <span>{comp.location}</span>}
                      {comp.is_virtual && <span>Virtual</span>}
                      {comp.grade_range_start && (
                        <span>
                          Grades {comp.grade_range_start}–{comp.grade_range_end}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {isRegistered ? (
                      <Badge className="bg-green-100 text-green-800">
                        {regStatus}
                      </Badge>
                    ) : comp.status === "registration_open" ? (
                      <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg">
                        Open
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
