"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Persona } from "@/lib/persona";
import {
  PERSONA_MONTHLY_REVENUE,
  PERSONA_RETENTION_MONTHS,
} from "@/lib/marketing-constants";

export interface MarketingMetrics {
  totalLeads: number;
  totalNew: number;
  totalContacted: number;
  totalConverted: number;
  overallConversionRate: number;
  bySource: {
    source: string;
    leads: number;
    converted: number;
    conversionRate: number;
    projectedLtv: number;
  }[];
  byPersona: {
    persona: Persona;
    leads: number;
    converted: number;
    conversionRate: number;
    avgMonthlyRevenue: number;
    projectedLtv: number;
  }[];
  totalProjectedLtv: number;
  totalActiveMrr: number;
}

export async function getMarketingMetrics(): Promise<{
  metrics: MarketingMetrics | null;
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { metrics: null, error: "Admin access required" };
  }

  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, status, source, persona, created_at");
  if (error) return { metrics: null, error: error.message };

  const list = leads || [];
  const totalLeads = list.length;
  const totalNew = list.filter((l) => l.status === "new").length;
  const totalContacted = list.filter(
    (l) => l.status !== "new" && l.status !== "lost",
  ).length;
  const totalConverted = list.filter((l) => l.status === "converted").length;
  const overallConversionRate =
    totalLeads > 0 ? totalConverted / totalLeads : 0;

  const sourceMap = new Map<string, { leads: number; converted: number }>();
  for (const l of list) {
    const key = l.source || "other";
    const entry = sourceMap.get(key) || { leads: 0, converted: 0 };
    entry.leads++;
    if (l.status === "converted") entry.converted++;
    sourceMap.set(key, entry);
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      converted: data.converted,
      conversionRate: data.leads > 0 ? data.converted / data.leads : 0,
      projectedLtv: data.converted * 400 * 18,
    }))
    .sort((a, b) => b.leads - a.leads);

  const personaMap = new Map<Persona, { leads: number; converted: number }>();
  for (const l of list) {
    const key = (l.persona || "unclassified") as Persona;
    const entry = personaMap.get(key) || { leads: 0, converted: 0 };
    entry.leads++;
    if (l.status === "converted") entry.converted++;
    personaMap.set(key, entry);
  }
  const byPersona = Array.from(personaMap.entries())
    .map(([persona, data]) => ({
      persona,
      leads: data.leads,
      converted: data.converted,
      conversionRate: data.leads > 0 ? data.converted / data.leads : 0,
      avgMonthlyRevenue: PERSONA_MONTHLY_REVENUE[persona],
      projectedLtv:
        data.converted *
        PERSONA_MONTHLY_REVENUE[persona] *
        PERSONA_RETENTION_MONTHS[persona],
    }))
    .sort((a, b) => b.leads - a.leads);

  const totalProjectedLtv = byPersona.reduce((s, p) => s + p.projectedLtv, 0);
  const totalActiveMrr = byPersona.reduce(
    (s, p) => s + p.converted * p.avgMonthlyRevenue,
    0,
  );

  return {
    metrics: {
      totalLeads,
      totalNew,
      totalContacted,
      totalConverted,
      overallConversionRate,
      bySource,
      byPersona,
      totalProjectedLtv,
      totalActiveMrr,
    },
    error: null,
  };
}
