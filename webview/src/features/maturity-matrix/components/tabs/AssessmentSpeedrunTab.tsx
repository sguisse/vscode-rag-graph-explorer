import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MaturityApplication, MaturityPillarDefinition } from '../../types/maturity-matrix.types';
import { getDateStatus } from '../../hooks/useMaturityMatrixState';

interface AssessmentSpeedrunTabProps {
  pillars: MaturityPillarDefinition[];
  applications: MaturityApplication[];
}

interface AppStats {
  id: string;
  code: string;
  name: string;
  leader: string;
  totalPillars: number;
  validPillars: number; // Green + Blue
  inProgressPillars: number; // Yellow + Orange
  outdatedPillars: number; // Red
  validRatio: number;
  latestDate: string | null;
  latestDateMs: number;
  avgScore: number;
  badgeType?: 'freshness' | 'recent' | 'coverage' | 'refresh';
  badgeTitle?: string;
  quote?: string;
}

export function AssessmentSpeedrunTab({ applications, pillars }: AssessmentSpeedrunTabProps) {
  const stats = useMemo(() => {
    const list: AppStats[] = applications.map((app) => {
      let valid = 0;
      let inProgress = 0;
      let outdated = 0;

      let latestMs = 0;
      let latestStr: string | null = null;

      let scoreSum = 0;
      let scoreCount = 0;

      // 1. Décompte initial des piliers sans date d'évaluation
      const nullDateCount = pillars.reduce((acc, pDef) => {
        const p = app.pillars[pDef.key];
        const isNullDate = !p || !p.date || p.date === 'null';
        return acc + (isNullDate ? 1 : 0);
      }, 0);

      // Règle : Si le nombre de piliers sans date est <= 2, ils sont ignorés du calcul du total
      const ignoreNullDates = nullDateCount <= 2;

      pillars.forEach((pDef) => {
        const pillar = app.pillars[pDef.key];
        if (!pillar) return;

        const isNullDate = !pillar.date || pillar.date === 'null';

        // Exclusion des piliers sans date si <= 2
        if (isNullDate && ignoreNullDates) {
          return;
        }

        // 2. Analyse du statut du pilier
        const status = getDateStatus(pillar.date);
        if (status === 'green' || status === 'blue') {
          valid += 1;
        } else if (status === 'orange' || status === 'yellow') {
          inProgress += 1;
        } else if (status === 'red') {
          outdated += 1;
        }

        // 3. Date d'évaluation la plus récente
        if (pillar.date && pillar.date !== 'null') {
          const ms = new Date(pillar.date).getTime();
          if (ms > latestMs) {
            latestMs = ms;
            latestStr = pillar.date;
          }
        }

        // 4. Somme des scores
        if (pillar.score) {
          scoreSum += Number(pillar.score);
          scoreCount += 1;
        }
      });

      const total = valid + inProgress + outdated;
      const validRatio = total > 0 ? Math.round((valid / total) * 100) : 0;
      const avgScore = scoreCount > 0 ? scoreSum / scoreCount : 0;

      return {
        id: app.id,
        code: app.code,
        name: app.name,
        leader: app.leader,
        totalPillars: total,
        validPillars: valid,
        inProgressPillars: inProgress,
        outdatedPillars: outdated,
        validRatio,
        latestDate: latestStr,
        latestDateMs: latestMs,
        avgScore,
      };
    });

    if (list.length === 0) return [];

    // --- Tri Principal (Ranking) ---
    // 1. % de piliers valides le plus élevé
    // 2. Date la plus récente
    // 3. Score moyen le plus élevé (départage)
    list.sort((a, b) => {
      if (b.validRatio !== a.validRatio) return b.validRatio - a.validRatio;
      if (b.latestDateMs !== a.latestDateMs) return b.latestDateMs - a.latestDateMs;
      return b.avgScore - a.avgScore;
    });

    // --- Attribution des Badges (Podium) ---
    const sortedByDate = [...list].sort((a, b) => b.latestDateMs - a.latestDateMs);
    const sortedByCoverage = [...list].sort((a, b) => b.validPillars - a.validPillars);
    const sortedByRefresh = [...list].sort((a, b) => (b.outdatedPillars + b.inProgressPillars) - (a.outdatedPillars + a.inProgressPillars));

    // 1. Freshness Champion (Le 1er du classement principal)
    if (list.length > 0 && list[0].validRatio > 0) {
      list[0].badgeType = 'freshness';
      list[0].badgeTitle = 'Freshness Champion ⚡';
      list[0].quote = 'Highest ratio of valid and up-to-date assessments!';
    }

    // 2. Most Recently Updated
    const recent = sortedByDate.find(app => !app.badgeType && app.latestDateMs > 0);
    if (recent) {
      recent.badgeType = 'recent';
      recent.badgeTitle = 'Most Recent 🚀';
      recent.quote = `Last assessment recorded on ${recent.latestDate}.`;
    }

    // 3. Full Coverage (Maximum de piliers valides en volume)
    const coverage = sortedByCoverage.find(app => !app.badgeType && app.validPillars > 0);
    if (coverage) {
      coverage.badgeType = 'coverage';
      coverage.badgeTitle = 'Full Coverage 🏋️';
      coverage.quote = `Leading the pack with ${coverage.validPillars} valid pillars.`;
    }

    // 4. In Need of Refresh
    const refresh = sortedByRefresh.find(app => !app.badgeType && (app.outdatedPillars > 0 || app.inProgressPillars > 0));
    if (refresh) {
      refresh.badgeType = 'refresh';
      refresh.badgeTitle = 'Needs Refresh 🐢';
      refresh.quote = `${refresh.outdatedPillars + refresh.inProgressPillars} pillars require immediate attention.`;
    }

    return list;
  }, [applications, pillars]);

  const podiumItems = useMemo(() => {
    const freshness = stats.find((s) => s.badgeType === 'freshness') || stats[0];
    const recent = stats.find((s) => s.badgeType === 'recent') || stats[1];
    const coverage = stats.find((s) => s.badgeType === 'coverage') || stats[2];
    const refresh = stats.find((s) => s.badgeType === 'refresh') || stats[stats.length - 1];

    return [
      {
        key: 'freshness',
        title: '⚡ FRESHNESS CHAMPION',
        app: freshness,
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        statText: `${freshness?.validRatio ?? 0}% Valid (${freshness?.validPillars ?? 0}/${freshness?.totalPillars ?? 0})`,
        quote: freshness?.quote || 'Top-tier assessment freshness.',
      },
      {
        key: 'recent',
        title: '🚀 MOST RECENTLY UPDATED',
        app: recent,
        badgeBg: 'bg-blue-50 border-blue-200 text-blue-900',
        statText: `Last assessed: ${recent?.latestDate ?? 'N/A'}`,
        quote: recent?.quote || 'Recently active assessment.',
      },
      {
        key: 'coverage',
        title: '🏋️ FULL COVERAGE (VOLUME)',
        app: coverage,
        badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        statText: `${coverage?.validPillars ?? 0} Valid Pillars`,
        quote: coverage?.quote || 'High volume of verified pillars.',
      },
      {
        key: 'refresh',
        title: '🐢 IN NEED OF REFRESH',
        app: refresh,
        badgeBg: 'bg-rose-50 border-rose-200 text-rose-900',
        statText: `${(refresh?.outdatedPillars ?? 0) + (refresh?.inProgressPillars ?? 0)} Pillars waiting`,
        quote: refresh?.quote || 'Action required to restore compliance.',
      },
    ];
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No application data available for the selected filters.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Top Podium Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {podiumItems.map((item) => (
          <Card key={item.key} className={`border ${item.badgeBg} p-3.5 rounded-xl shadow-xs`}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <span>{item.title}</span>
              </div>
              <div className="mt-2 text-base font-black text-slate-900 truncate" title={item.app?.name}>
                {item.app?.name || '—'}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-700">
                {item.statText}
              </div>
              <div className="mt-2 text-[11px] italic text-slate-500 border-t border-slate-200/60 pt-1.5">
                {item.quote}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cumulated Stacked Bar Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🏎️ Assessment Freshness Leaderboard</span>
            </h2>
            <p className="text-xs text-slate-500">
              Applications ranked by highest % of valid assessments (Green/Blue) and most recent updates.
              <span className="ml-1 text-slate-400 font-normal">
                (Pillars without assessment date are excluded from total if ≤ 2)
              </span>
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
              Valid (≤5M)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-3 w-3 rounded bg-amber-400 inline-block" />
              Todo / In Progress (&gt;5M or None &gt;2)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="h-3 w-3 rounded bg-rose-500 inline-block" />
              Outdated (&gt;6M)
            </span>
          </div>
        </div>

        {/* Stacked Rows */}
        <div className="space-y-4">
          {stats.map((item, idx) => {
            const validPct = item.totalPillars > 0 ? (item.validPillars / item.totalPillars) * 100 : 0;
            const inProgressPct = item.totalPillars > 0 ? (item.inProgressPillars / item.totalPillars) * 100 : 0;
            const outdatedPct = item.totalPillars > 0 ? (item.outdatedPillars / item.totalPillars) * 100 : 0;

            const tooltipContent = `${item.name} (${item.code})\nLeader: ${item.leader}\n• Valid: ${item.validPillars} | In Progress: ${item.inProgressPillars} | Outdated: ${item.outdatedPillars}\n• Total Evaluated Pillars: ${item.totalPillars}\n• Latest Assessment: ${item.latestDate || 'N/A'}`;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/60 transition-colors"
                title={tooltipContent}
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                      {item.name}
                    </span>

                    {item.badgeTitle && (
                      <Badge className="rounded-full text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border-amber-300" variant="secondary">
                        {item.badgeTitle}
                      </Badge>
                    )}

                    <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                      [{item.code}]
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-slate-500 font-normal">
                      Latest: <strong className="text-slate-800">{item.latestDate || 'N/A'}</strong>
                    </span>
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {item.validRatio}% Valid ({item.validPillars}/{item.totalPillars})
                    </span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
                  {validPct > 0 && (
                    <div
                      className="h-full bg-emerald-500 transition-all border-r border-white/20 last:border-r-0"
                      style={{ width: `${validPct}%` }}
                      title={`Valid: ${item.validPillars} (${Math.round(validPct)}%)`}
                    />
                  )}
                  {inProgressPct > 0 && (
                    <div
                      className="h-full bg-amber-400 transition-all border-r border-white/20 last:border-r-0"
                      style={{ width: `${inProgressPct}%` }}
                      title={`In Progress / Todo: ${item.inProgressPillars} (${Math.round(inProgressPct)}%)`}
                    />
                  )}
                  {outdatedPct > 0 && (
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${outdatedPct}%` }}
                      title={`Outdated: ${item.outdatedPillars} (${Math.round(outdatedPct)}%)`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AssessmentSpeedrunTab;
