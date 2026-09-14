import { useMemo, useState } from 'react';
import { MatrixOverviewTab } from './tabs/MatrixOverviewTab';
import { CategoryDetailsTab } from './tabs/CategoryDetailsTab';
import { MaturityReportTab } from './tabs/MaturityReportTab';
import { TempHtmlTab } from './tabs/TempHtmlTab';

type TabKey = 'overview' | 'details' | 'report' | 'temp-html';

export function MaturityMatrixPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [lastExtractedAt, setLastExtractedAt] = useState<string>('Not run yet');

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'details', label: 'Details' },
    { key: 'report', label: 'Report' },
    { key: 'temp-html', label: 'Temp HTML' },
  ];

  const csvRows = useMemo(
    () => [
      ['category', 'status', 'score', 'notes'],
      ['strategy', 'ready', '90', 'Strong direction'],
      ['delivery', 'in_progress', '72', 'Needs process cleanup'],
      ['governance', 'pending', '64', 'Review risk controls'],
      ['quality', 'ready', '88', 'Mature reviews'],
    ],
    []
  );

  const csvContent = useMemo(
    () => csvRows.map((row) => row.join(',')).join('\n'),
    [csvRows]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MatrixOverviewTab/>;
      case 'details':
        return <CategoryDetailsTab/>;
      case 'report':
        return <MaturityReportTab/>;
      case 'temp-html':
        return <TempHtmlTab/>;
      default:
        return null;
    }
  };

  const handleExtractAll = () => {
    setLastExtractedAt(new Date().toLocaleString());
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 bg-background p-4 text-foreground min-h-0 overflow-hidden">
      <header className="rounded-xl border border-border bg-card p-4 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
              Maturity Matrix
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">Repository maturity insights</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground font-mono">
              Last extract: {lastExtractedAt}
            </div>
            <button
              type="button"
              onClick={handleExtractAll}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 cursor-pointer"
            >
              Extract ALL
            </button>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                ].join(' ')}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row overflow-hidden">
        <section className="min-h-0 flex-1 flex flex-col overflow-hidden rounded-xl border border-border bg-card p-3">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground shrink-0 font-semibold">Result</div>
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            {renderTabContent()}
          </div>
        </section>

        <div className="hidden w-px bg-border xl:block shrink-0" />


      </div>
    </div>
  );
}

export default MaturityMatrixPanel;
