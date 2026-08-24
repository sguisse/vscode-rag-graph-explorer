import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
  Search,
  Loader2
} from 'lucide-react';
import { useInstallPanel } from './hooks/use-install-panel';

const CARDS_PER_ROW = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  wide: 'xl:grid-cols-5',
} as const;

const CARDS_GRID_LAYOUT = `${CARDS_PER_ROW.mobile} ${CARDS_PER_ROW.tablet} ${CARDS_PER_ROW.desktop} ${CARDS_PER_ROW.wide}`;

const TEXT_SIZES = {
  heroBadge: 'text-xs',
  heroTitle: 'text-xl sm:text-2xl',
  heroDescription: 'text-xs',
  heroStatLabel: 'text-[10px]',
  heroStatValue: 'text-sm',
  heroButton: 'text-xs',

  sectionTitle: 'text-sm',
  countBadge: 'text-[11px]',
  searchInput: 'text-xs',
  filterButton: 'text-xs',

  cardTitle: 'text-xs',
  cardSubText: 'text-[10px]',
  cardBadge: 'text-[10px]',

  stepTitle: 'text-[12px]',
  stepBadge: 'text-[10px]',
  stepMessage: 'text-[11px]',
  stepCode: 'text-[10.5px]',
} as const;

const getStatusColors = (status?: string) => {
  switch (status) {
    case '✅':
      return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
    case '❌':
      return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40', badgeBg: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle };
    case '⚠️':
      return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40', badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle };
    default:
      return { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', badgeBg: 'bg-muted text-muted-foreground border-border', icon: Activity };
  }
};

export function InstallPanel() {
  const {
    globalSummary,
    modules,
    isLoading,
    isError,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    handleRerun,
  } = useInstallPanel();

  const globalStatusStyle = getStatusColors(globalSummary?.globalStatus);
  const GlobalIcon = globalStatusStyle.icon;

  if (isError || (!isLoading && !globalSummary)) {
    return (
      <div className="flex-1 space-y-4 bg-background p-4 min-h-0 overflow-y-auto text-foreground">
        <div className="flex flex-col justify-center items-center gap-4 bg-card/80 p-8 border border-amber-500/30 rounded-xl text-center">
          <div className="bg-amber-500/10 p-3 rounded-full text-amber-500">
            <Loader2 size={24} className="animate-spin" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-bold text-foreground text-sm">Install Check Process Running</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Install check process is still running or report is unavailable. Click on the button « Re-run » to recall the service and update the panel.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleRerun}
            disabled={isLoading}
            className="gap-2 shadow-xs font-semibold cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Re-run
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !globalSummary) {
    return (
      <div className="flex justify-center items-center bg-background min-h-[300px]">
        <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
          <Loader2 size={16} className="text-primary animate-spin" />
          <span>Fetching installation telemetry report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 bg-background p-3 md:p-4 min-h-0 overflow-y-auto text-foreground">

      {/* 1. HERO BANNER */}
      <div className={`relative bg-gradient-to-br from-primary/10 via-background to-${globalStatusStyle.text.split('-')[1]}-500/10 shadow-sm p-4 md:p-5 border ${globalStatusStyle.border} rounded-xl overflow-hidden`}>
        <div className="z-10 relative flex md:flex-row flex-col justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full font-mono font-semibold ${TEXT_SIZES.heroBadge} ${globalStatusStyle.badgeBg}`}>
              <GlobalIcon size={14} className={globalSummary?.globalStatus === '⚠️' ? 'animate-pulse' : ''} />
              <span>Environment Diagnostic Status</span>
            </div>

            <h1 className={`font-extrabold text-foreground ${TEXT_SIZES.heroTitle} leading-tight tracking-tight`}>
              Installation & <span className="bg-clip-text bg-gradient-to-r from-emerald-400 via-primary to-amber-400 text-transparent">Health Check</span>
            </h1>

            <p className={`text-muted-foreground ${TEXT_SIZES.heroDescription} leading-relaxed`}>
              {globalSummary && globalSummary.koCount > 0
                ? "Attention required: Validation failed on specific components. Check the highlighted steps below."
                : "All system prerequisites and graph engine dependencies are operational and fully configured."}
            </p>
          </div>

          {/* Telemetry Summary */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            {globalSummary && (
              <div className="flex items-center gap-4 bg-card/70 shadow-xs backdrop-blur-md px-3 py-2 border border-border/70 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <span className={`text-muted-foreground block ${TEXT_SIZES.heroStatLabel} uppercase font-mono`}>Total</span>
                  <span className={`font-mono font-bold ${TEXT_SIZES.heroStatValue}`}>{globalSummary.stepsCount}</span>
                </div>
                <div className="bg-border/60 w-px h-6" />
                <div className="flex flex-col items-center text-center">
                  <span className={`text-emerald-500 block ${TEXT_SIZES.heroStatLabel} uppercase font-mono font-semibold`}>Passed</span>
                  <span className={`font-mono font-bold text-emerald-500 ${TEXT_SIZES.heroStatValue}`}>{globalSummary.okCount}</span>
                </div>
                {globalSummary.koCount > 0 && (
                  <>
                    <div className="bg-border/60 w-px h-6" />
                    <div className="flex flex-col items-center text-center">
                      <span className={`text-red-500 block ${TEXT_SIZES.heroStatLabel} uppercase font-mono font-semibold`}>Errors</span>
                      <span className={`font-mono font-bold text-red-500 ${TEXT_SIZES.heroStatValue}`}>{globalSummary.koCount}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button
              size="sm"
              onClick={handleRerun}
              disabled={isLoading}
              className={`gap-1.5 font-semibold shadow-xs cursor-pointer ${TEXT_SIZES.heroButton} h-9`}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Re-run
            </Button>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="flex sm:flex-row flex-col justify-between items-stretch sm:items-center gap-2.5 bg-card/60 shadow-xs p-2.5 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <h2 className={`flex items-center gap-1.5 font-bold text-foreground ${TEXT_SIZES.sectionTitle} tracking-tight`}>
            <Activity className="text-primary" size={16} /> Component Telemetry
          </h2>
          <span className={`font-mono bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold ${TEXT_SIZES.countBadge}`}>
            {modules.length} {modules.length === 1 ? 'module' : 'modules'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-130">
            <Search size={14} className="top-2 left-2.5 absolute text-muted-foreground" />
            <input
              type="text"
              placeholder="Search components or check names (e.g. node, java)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-background border border-border rounded-md pl-8 pr-2.5 py-1 ${TEXT_SIZES.searchInput} font-mono focus:outline-none focus:ring-1 focus:ring-primary`}
            />
          </div>

          <div className={`flex bg-muted/60 p-0.5 rounded border border-border/60 ${TEXT_SIZES.filterButton} font-medium`}>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'ALL' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ERRORS')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'ERRORS' ? 'bg-red-500 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Errors ({globalSummary?.koCount ?? 0})
            </button>
            <button
              onClick={() => setFilter('CORE')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'CORE' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Core
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONDENSED CARDS GRID */}
      <div className={`gap-3 grid ${CARDS_GRID_LAYOUT}`}>
        {modules.map((module) => {
          const ModIcon = module.icon;
          const isError = module.summary?.koCount > 0;
          const modStyle = getStatusColors(module.summary?.globalStatus);

          return (
            <Card
              key={module.id}
              className={`flex flex-col bg-card shadow-xs transition-all duration-200 border-l-4 ${
                isError
                  ? 'border-l-red-500 border-red-500/30 bg-red-500/[0.02]'
                  : 'border-l-emerald-500 hover:border-primary/40'
              }`}
            >
              <CardHeader className="space-y-0 p-2.5 pb-2 border-border/50 border-b">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`p-1.5 rounded-md shrink-0 ${modStyle.bg} ${modStyle.text}`}>
                      <ModIcon size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <CardTitle className={`font-bold text-foreground ${TEXT_SIZES.cardTitle} uppercase tracking-wider truncate`}>
                        {module.name}
                      </CardTitle>
                      <div className={`text-muted-foreground font-mono ${TEXT_SIZES.cardSubText}`}>
                        {module.summary?.okCount}/{module.summary?.stepsCount} passed
                      </div>
                    </div>
                  </div>

                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${TEXT_SIZES.cardBadge} ${modStyle.badgeBg}`}>
                    {module.summary?.globalStatus === '✅' ? 'OK' : 'FAIL'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-1.5 p-2">
                {Object.entries(module).map(([stepKey, stepData]: [string, any]) => {
                  if (['summary', 'id', 'name', 'icon'].includes(stepKey)) return null;

                  const stepStyle = getStatusColors(stepData?.status);
                  const StepIcon = stepStyle.icon;

                  return (
                    <div
                      key={stepKey}
                      className={`p-2 rounded border transition-colors ${
                        stepData?.status === '❌'
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : 'bg-muted/20 border-border/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-1.5">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <StepIcon size={14} className={`shrink-0 ${stepStyle.text}`} />
                          <span className={`font-semibold ${TEXT_SIZES.stepTitle} text-foreground capitalize truncate`}>
                            {stepKey.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className={`font-mono font-bold px-1 py-0.2 rounded uppercase shrink-0 ${TEXT_SIZES.stepBadge} ${
                          stepData?.status === '✅' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500 text-white'
                        }`}>
                          {stepData?.status === '✅' ? 'OK' : 'FAIL'}
                        </span>
                      </div>

                      {(stepData?.message || stepData?.version) && (
                        <p className={`mt-1 leading-tight ${TEXT_SIZES.stepMessage} ${stepData?.status === '❌' ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                          {stepData?.message || stepData?.version}
                        </p>
                      )}

                      {(stepData?.path || stepData?.location) && (
                        <div className="bg-background/60 mt-1 px-1.5 py-0.5 border border-border/50 rounded overflow-x-auto">
                          <code className={`${TEXT_SIZES.stepCode} text-muted-foreground font-mono block truncate`}>
                            {stepData?.path || stepData?.location}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

export default InstallPanel;
