interface KpiSummary {
  totalApps: number;
  avgScore: string;
  avgPrevScore: string;
  scoreDelta: string;
  totalTargets: number;
  freshPercent: number;
  freshPillarsCount: number;
  totalEligiblePillars: number;
  over5MonthsCount: number;
  leaderCount: number;
}

interface MaturityMatrixKpisProps {
  metrics: KpiSummary;
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
        <div className="mt-2 text-[11px] text-slate-500"></div>
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
          <span>Fresh Assessments</span>
          <span>🗓️</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-emerald-600">{metrics.freshPercent}%</div>
        <div className="mt-2 text-[11px] text-slate-500">
          {metrics.freshPillarsCount} / {metrics.totalEligiblePillars} pillars ≤ 6M ({metrics.over5MonthsCount} &gt; 5M)
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
