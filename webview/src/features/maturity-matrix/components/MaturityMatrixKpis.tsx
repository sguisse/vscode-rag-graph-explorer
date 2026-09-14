interface KpiSummary {
  totalApps: number;
  avgScore: string;
  avgPrevScore: string;
  scoreDelta: string;
  totalTargets: number;
  extractPercent: number;
  finishedExtracts: number;
  totalPillarsCount: number;
  leaderCount: number;
}

interface MaturityMatrixKpisProps {
  metrics: KpiSummary;
}

const primaryCards = [
  { label: 'Tracked Applications', value: 'totalApps', accent: 'text-slate-900' },
  { label: 'Avg Maturity Score', value: 'avgScore', accent: 'text-indigo-700' },
  { label: 'Targeted Pillars', value: 'totalTargets', accent: 'text-amber-600' },
  { label: 'Extracts Finished', value: 'extractPercent', accent: 'text-emerald-600' },
  { label: 'Active Leaders', value: 'leaderCount', accent: 'text-violet-700' },
] as const;

function formatValue(label: string, metrics: KpiSummary) {
  switch (label) {
    case 'tracked':
      return metrics.totalApps;
    case 'avgScore':
      return `${metrics.avgScore}`;
    case 'targets':
      return metrics.totalTargets;
    case 'extracts':
      return `${metrics.extractPercent}%`;
    case 'leaders':
      return metrics.leaderCount;
    default:
      return '';
  }
}

export function MaturityMatrixKpis({ metrics }: MaturityMatrixKpisProps) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span>Tracked Applications</span>
          <span>📊</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-slate-900">{metrics.totalApps}</div>
        <div className="mt-2 text-[11px] text-slate-500">TO Generate = TRUE ({metrics.totalApps} apps)</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span>Avg Maturity Score</span>
          <span>📈</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-700">{metrics.avgScore}</span>
          <span className="text-[11px] text-slate-400">/ 5.0</span>
          <span className="text-[11px] font-semibold text-emerald-600">{metrics.scoreDelta}</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">Prev: {metrics.avgPrevScore}</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span>Targeted Pillars</span>
          <span>🎯</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-amber-600">{metrics.totalTargets}</div>
        <div className="mt-2 text-[11px] text-slate-500">Expected improvement active</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span>Extracts Finished</span>
          <span>✅</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-emerald-600">{metrics.extractPercent}%</div>
        <div className="mt-2 text-[11px] text-slate-500">
          {metrics.finishedExtracts} / {metrics.totalPillarsCount} pillars 100%
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <span>Active Leaders</span>
          <span>👥</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-violet-700">{metrics.leaderCount}</div>
        <div className="mt-2 text-[11px] text-slate-500">Leaders currently tracked</div>
      </div>
    </section>
  );
}
