import type { MonthlyServiceRecord } from '../types';

interface MonthlySupportProductPerformanceDashboardCardGridProps {
  records: MonthlyServiceRecord[];
}

export function MonthlySupportProductPerformanceDashboardCardGrid({ records }: MonthlySupportProductPerformanceDashboardCardGridProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => (
        <article key={record.serviceProduit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{record.domaine}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{record.serviceProduit}</h3>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
              Live
            </span>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Volume Tickets</dt>
              <dd className="font-semibold text-slate-900">{record.volumeTickets || 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Disponibilité</dt>
              <dd className="font-semibold text-slate-900">{record.disponibilite ? `${(record.disponibilite * 100).toFixed(2)}%` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Respect OLA</dt>
              <dd className="font-semibold text-slate-900">{record.respectOLA ? `${(record.respectOLA * 100).toFixed(2)}%` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">First Time Fix</dt>
              <dd className="font-semibold text-slate-900">{record.firstTimeFix ? `${(record.firstTimeFix * 100).toFixed(2)}%` : '—'}</dd>
            </div>
          </dl>

          {record.faitsMarquants && (
            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {record.faitsMarquants}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
