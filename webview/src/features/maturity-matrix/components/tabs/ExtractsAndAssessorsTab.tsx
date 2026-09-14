import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MaturityApplication, MaturityPillarDefinition } from '../../types/maturity-matrix.types';

interface ExtractsAndAssessorsTabProps {
  pillars: MaturityPillarDefinition[];
  applications: MaturityApplication[];
}

export function ExtractsAndAssessorsTab({ pillars, applications }: ExtractsAndAssessorsTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Pending Review Extracts & Assessor Workload</h2>
        <p className="text-xs text-slate-500">Overview of extract progression and current assessor ownership.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {applications.map((app) => (
          <Card key={app.id} className="border-slate-200 bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                  <p className="text-[11px] text-slate-500">{app.code}</p>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  Leader: {app.leader}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pillars.map((pillar) => {
                  const pillarData = app.pillars[pillar.key];
                  const progress = Math.round(Number(pillarData?.lastExtract ?? 0));
                  const prevProgress = Math.round(Number(pillarData?.prevExtract ?? 0));
                  const assessor = pillarData?.assessor || '—';

                  return (
                    <div key={`${app.id}-${pillar.key}`} className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{pillar.icon}</span>
                          <span className="text-[11px] font-semibold text-slate-700">{pillar.label}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-700">{progress}%</span>
                      </div>

                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span>Assessor</span>
                        <span className="max-w-[120px] truncate font-medium text-slate-700" title={assessor}>{assessor}</span>
                      </div>

                      <div className="mt-1 text-[10px] text-slate-400">Prev: {prevProgress}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
