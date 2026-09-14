import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MaturityApplication, MaturityPillarDefinition } from '../../types/maturity-matrix.types';

interface PillarDeltaAnalyticsTabProps {
  pillars: MaturityPillarDefinition[];
  applications: MaturityApplication[];
}

export function PillarDeltaAnalyticsTab({ pillars, applications }: PillarDeltaAnalyticsTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Pillar Score Evolution</h2>
        <p className="text-xs text-slate-500">Last vs previous assessment across tracked applications.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => {
          const entries = applications.map((app) => {
            const pillarData = app.pillars[pillar.key];
            return {
              appCode: app.code,
              appName: app.name,
              score: Number(pillarData?.score ?? 0),
              prevScore: Number(pillarData?.prevScore ?? 0),
              target: Boolean(pillarData?.target),
            };
          });

          return (
            <Card key={pillar.key} className="border-slate-200 bg-slate-50 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pillar.icon}</span>
                    <span className="text-sm font-bold text-slate-800">{pillar.label}</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {entries.filter((entry) => entry.target).length} targeted
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {entries.map((entry) => {
                    const delta = entry.score - entry.prevScore;
                    return (
                      <div key={`${pillar.key}-${entry.appCode}`} className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-semibold text-slate-700" title={entry.appName}>{entry.appCode}</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="text-slate-900">{entry.score.toFixed(2)}</span>
                            <span className="text-slate-400">/ 5</span>
                            {delta !== 0 && (
                              <span className={delta > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="w-10 text-left">Current</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, (entry.score / 5) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="w-10 text-left">Prev</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-slate-400" style={{ width: `${Math.min(100, (entry.prevScore / 5) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
