import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaturityApplication, MaturityPillarDefinition, FormulaCalculType } from '../../types/maturity-matrix.types';
import { getDateStatus } from '../../hooks/useMaturityMatrixState';

interface AssessorSpeedrunTabProps {
  pillars: MaturityPillarDefinition[];
  applications: MaturityApplication[];
}

interface AssessorStats {
  name: string;
  appsCount: number;
  totalPillars: number;
  finishedPillars: number;
  inProgressPillars: number;
  notStartedPillars: number;
  avgCompletion: number;
  avgPrevCompletion: number;
  delta: number;
  badgeType?: 'speed_demon' | 'rocket' | 'atlas' | 'eco';
  badgeTitle?: string;
  badgeIcon?: string;
  quote: string;
}

export function AssessorSpeedrunTab({ applications }: AssessorSpeedrunTabProps) {
  const [formulaType, setFormulaType] = useState<FormulaCalculType>('completion');

  const stats = useMemo(() => {
    const map = new Map<
      string,
      {
        apps: Set<string>;
        total: number;
        finished: number;
        inProgress: number;
        notStarted: number;
        sumExtract: number;
        sumPrevExtract: number;
      }
    >();

    applications.forEach((app) => {
      Object.values(app.pillars).forEach((pillar) => {
        const assessor = pillar.assessor?.trim();
        if (!assessor || assessor === '-' || assessor === 'null') return;

        if (!map.has(assessor)) {
          map.set(assessor, {
            apps: new Set(),
            total: 0,
            finished: 0,
            inProgress: 0,
            notStarted: 0,
            sumExtract: 0,
            sumPrevExtract: 0,
          });
        }

        const entry = map.get(assessor)!;
        entry.apps.add(app.code || app.id);
        entry.total += 1;

        const currExtract = Math.round(Number(pillar.lastExtract ?? 0));
        const prevExtract = Math.round(Number(pillar.prevExtract ?? 0));
        entry.sumExtract += currExtract;
        entry.sumPrevExtract += prevExtract;

        if (formulaType === 'completion') {
          const dateStatus = getDateStatus(pillar.date);
          // Un pilier est considéré terminé si sa date est verte (<=15j) ou bleue (<=150j valid)
          const isFinished = dateStatus === 'green' || dateStatus === 'blue';
          if (isFinished) {
            entry.finished += 1;
          } else if (dateStatus === 'orange' || dateStatus === 'yellow') {
            entry.inProgress += 1;
          } else {
            entry.notStarted += 1;
          }
        } else {
          if (currExtract >= 100) {
            entry.finished += 1;
          } else if (currExtract > 0) {
            entry.inProgress += 1;
          } else {
            entry.notStarted += 1;
          }
        }
      });
    });

    const list: AssessorStats[] = Array.from(map.entries()).map(([name, data]) => {
      let avgCompletion = 0;
      let avgPrevCompletion = 0;

      if (formulaType === 'completion') {
        avgCompletion = data.total > 0 ? Math.round((data.finished / data.total) * 100) : 0;
        avgPrevCompletion = 0;
      } else {
        avgCompletion = data.total > 0 ? Math.round(data.sumExtract / data.total) : 0;
        avgPrevCompletion = data.total > 0 ? Math.round(data.sumPrevExtract / data.total) : 0;
      }

      const delta = avgCompletion - avgPrevCompletion;

      return {
        name,
        appsCount: data.apps.size,
        totalPillars: data.total,
        finishedPillars: data.finished,
        inProgressPillars: data.inProgress,
        notStartedPillars: data.notStarted,
        avgCompletion,
        avgPrevCompletion,
        delta,
        quote:
          formulaType === 'completion'
            ? 'Recent valid assessments up to date!'
            : 'Steadily advancing assessment extract progress!',
      };
    });

    if (list.length === 0) return [];

    let speedDemonIdx = -1;
    let maxFinished = -1;

    let rocketIdx = -1;
    let maxDelta = -Infinity;

    let atlasIdx = -1;
    let maxPillars = -1;

    let ecoIdx = -1;
    let maxNotStarted = -1;

    list.forEach((item, idx) => {
      if (item.finishedPillars > maxFinished) {
        maxFinished = item.finishedPillars;
        speedDemonIdx = idx;
      }

      if (item.delta > maxDelta) {
        maxDelta = item.delta;
        rocketIdx = idx;
      }

      if (item.totalPillars > maxPillars) {
        maxPillars = item.totalPillars;
        atlasIdx = idx;
      }

      if (item.notStartedPillars > maxNotStarted) {
        maxNotStarted = item.notStartedPillars;
        ecoIdx = idx;
      }
    });

    if (speedDemonIdx !== -1 && list[speedDemonIdx].finishedPillars > 0) {
      list[speedDemonIdx].badgeType = 'speed_demon';
      list[speedDemonIdx].badgeTitle = 'Speed Demon ⚡';
      list[speedDemonIdx].badgeIcon = '⚡';
      list[speedDemonIdx].quote =
        formulaType === 'completion'
          ? 'Assessments fresh & valid (Green/Blue status)!'
          : 'Faster than CI/CD! Code ships before sprint starts.';
    }

    if (rocketIdx !== -1 && rocketIdx !== speedDemonIdx && list[rocketIdx].delta > 0) {
      list[rocketIdx].badgeType = 'rocket';
      list[rocketIdx].badgeTitle = 'Rocket Progress 🚀';
      list[rocketIdx].badgeIcon = '🚀';
      list[rocketIdx].quote = 'Boosters activated! Unstoppable momentum.';
    }

    if (atlasIdx !== -1 && list[atlasIdx].badgeType === undefined && list[atlasIdx].totalPillars > 5) {
      list[atlasIdx].badgeType = 'atlas';
      list[atlasIdx].badgeTitle = 'Atlas 🏋️';
      list[atlasIdx].badgeIcon = '🏋️';
      list[atlasIdx].quote = 'Carrying the entire architecture on their shoulders.';
    }

    if (ecoIdx !== -1 && list[ecoIdx].badgeType === undefined && list[ecoIdx].notStartedPillars > 2) {
      list[ecoIdx].badgeType = 'eco';
      list[ecoIdx].badgeTitle = 'En Mode Éco 🐢';
      list[ecoIdx].badgeIcon = '🐢';
      list[ecoIdx].quote = 'Saving battery power for next sprint...';
    }

    return list.sort((a, b) => b.avgCompletion - a.avgCompletion || b.finishedPillars - a.finishedPillars);
  }, [applications, formulaType]);

  const podiumItems = useMemo(() => {
    const speedDemon = stats.find((s) => s.badgeType === 'speed_demon') || stats[0];
    const rocket = stats.find((s) => s.badgeType === 'rocket') || stats[1];
    const atlas = stats.find((s) => s.badgeType === 'atlas') || stats[2];
    const eco = stats.find((s) => s.badgeType === 'eco') || stats[stats.length - 1];

    return [
      {
        key: 'speed',
        title: '⚡ SPEED DEMON',
        assessor: speedDemon,
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
        statText: `${speedDemon?.avgCompletion ?? 0}% Finished (${speedDemon?.finishedPillars ?? 0} pillars)`,
        quote: speedDemon?.quote || 'Lightning fast assessment completions!',
      },
      {
        key: 'rocket',
        title: '🚀 ROCKET PROGRESS',
        assessor: rocket,
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        statText: `+${rocket?.delta ?? 0}% delta progress`,
        quote: rocket?.quote || 'Unstoppable momentum!',
      },
      {
        key: 'atlas',
        title: '🏋️ ATLAS (VOLUME)',
        assessor: atlas,
        badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        statText: `${atlas?.appsCount ?? 0} Apps / ${atlas?.totalPillars ?? 0} Pillars`,
        quote: atlas?.quote || 'Heavy lifting champion.',
      },
      {
        key: 'eco',
        title: '🐢 EN MODE ÉCO',
        assessor: eco,
        badgeBg: 'bg-slate-100 border-slate-200 text-slate-800',
        statText: `${eco?.notStartedPillars ?? 0} Pillars waiting`,
        quote: eco?.quote || 'Saving battery power for next sprint...',
      },
    ];
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No assessor data available for the selected filters.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Selector for FormulaCalculType */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Formula Mode:</span>
          <Select onValueChange={(val) => setFormulaType(val as FormulaCalculType)} value={formulaType}>
            <SelectTrigger className="h-8 w-[320px] border-slate-200/80 bg-slate-50/80 text-xs font-bold text-slate-800 rounded-lg shadow-2xs focus:ring-1 focus:ring-indigo-500">
              <SelectValue placeholder="Select formula"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completion">
                📅 Assessment Date (Green/Blue = Finished)
              </SelectItem>
              <SelectItem value="extract_average">
                📊 Extract Progression (% Average)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-slate-500 italic">
          {formulaType === 'completion'
            ? '💡 Finished rule: Pillar assessment date is in Green (≤15d) or Blue (Valid ≤5M) status.'
            : '💡 Finished rule: Pillar extract progress reaches 100% completion.'}
        </div>
      </div>

      {/* Top Podium Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {podiumItems.map((item) => (
          <Card key={item.key} className={`border ${item.badgeBg} p-3.5 rounded-xl shadow-xs`}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <span>{item.title}</span>
              </div>
              <div className="mt-2 text-base font-black text-slate-900">
                {item.assessor?.name || '—'}
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
              <span>🏎️ Assessor Completion Velocity</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cumulative stacked progress across assigned application pillars.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
              {formulaType === 'completion' ? 'Finished (Green/Blue)' : 'Finished (100%)'}
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="h-3 w-3 rounded bg-indigo-500 inline-block" />
              {formulaType === 'completion' ? 'In Progress (Orange/Yellow)' : 'In Progress (1-99%)'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-3 w-3 rounded bg-slate-200 inline-block" />
              {formulaType === 'completion' ? 'Outdated/Missing (Red)' : 'Not Started (0%)'}
            </span>
          </div>
        </div>

        {/* Stacked Rows */}
        <div className="space-y-4">
          {stats.map((item, idx) => {
            const finishedPct = item.totalPillars > 0 ? (item.finishedPillars / item.totalPillars) * 100 : 0;
            const inProgressPct = item.totalPillars > 0 ? (item.inProgressPillars / item.totalPillars) * 100 : 0;
            const notStartedPct = item.totalPillars > 0 ? (item.notStartedPillars / item.totalPillars) * 100 : 0;

            const tooltipContent = `${item.name}\n• Apps: ${item.appsCount} | Total Pillars: ${item.totalPillars}\n• Finished: ${item.finishedPillars} | In Progress: ${item.inProgressPillars} | Pending: ${item.notStartedPillars}\n• Rate: ${item.avgCompletion}%\n💬 "${item.quote}`;

            return (
              <div
                key={item.name}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/60 transition-colors"
                title={tooltipContent}
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.name}
                    </span>

                    {item.badgeTitle && (
                      <Badge className="rounded-full text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border-amber-300" variant="secondary">
                        {item.badgeTitle}
                      </Badge>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      [{item.appsCount} Apps • {item.totalPillars} Pillars]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-slate-800">
                      {item.avgCompletion}% completion
                    </span>
                    <span
                      className={`text-[11px] font-extrabold ${
                        item.delta > 0
                          ? 'text-emerald-600'
                          : item.delta < 0
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.delta > 0 ? `↗️ +${item.delta}%` : item.delta < 0 ? `↘️ ${item.delta}%` : '➡️ 0%'}
                    </span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
                  {finishedPct > 0 && (
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${finishedPct}%` }}
                      title={`Finished: ${item.finishedPillars} (${Math.round(finishedPct)}%)`}
                    />
                  )}
                  {inProgressPct > 0 && (
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${inProgressPct}%` }}
                      title={`In Progress: ${item.inProgressPillars} (${Math.round(inProgressPct)}%)`}
                    />
                  )}
                  {notStartedPct > 0 && (
                    <div
                      className="h-full bg-slate-300 transition-all"
                      style={{ width: `${notStartedPct}%` }}
                      title={`Not Started/Outdated: ${item.notStartedPillars} (${Math.round(notStartedPct)}%)`}
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

export default AssessorSpeedrunTab;
