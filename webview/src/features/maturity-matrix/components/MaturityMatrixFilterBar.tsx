import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaturityMatrixTabId, DateStatus } from '../types/maturity-matrix.types';

interface MaturityMatrixFilterBarProps {
  activeTab: MaturityMatrixTabId;
  selectedLeader: string;
  selectedAssessor: string;
  selectedPillar: string;
  selectedDateStatus: DateStatus | 'ALL';
  searchQuery: string;
  leaderOptions: string[];
  assessorOptions: string[];
  pillarOptions: Array<{ key: string; label: string; icon: string }>;
  statusCounts: Record<DateStatus | 'ALL', number>;
  onTabChange: (tab: MaturityMatrixTabId) => void;
  onSelectedLeaderChange: (value: string) => void;
  onSelectedAssessorChange: (value: string) => void;
  onSelectedPillarChange: (value: string) => void;
  onSelectedDateStatusChange: (value: DateStatus | 'ALL') => void;
  onSearchQueryChange: (value: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export function MaturityMatrixFilterBar({
  activeTab,
  selectedLeader,
  selectedAssessor,
  selectedPillar,
  selectedDateStatus,
  searchQuery,
  leaderOptions,
  assessorOptions,
  pillarOptions,
  statusCounts,
  onTabChange,
  onSelectedLeaderChange,
  onSelectedAssessorChange,
  onSelectedPillarChange,
  onSelectedDateStatusChange,
  onSearchQueryChange,
}: MaturityMatrixFilterBarProps) {
  const tabs: Array<{ key: MaturityMatrixTabId; label: string; icon: React.ReactNode }> = [
    {
      key: 'matrix',
      label: 'Maturity Matrix View',
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      key: 'compare',
      label: 'Pillar Delta Analytics',
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      key: 'extracts',
      label: 'Extracts & Assessors',
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
  ];

  const selectedPillarObj = pillarOptions.find((p) => p.key === selectedPillar);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* View Switcher Tabs */}
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/60">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Dropdowns & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Leader Filter */}
          <Select value={selectedLeader} onValueChange={(value) => onSelectedLeaderChange(value || 'ALL')}>
            <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
              <span className="text-slate-400 font-normal">Leader:</span>
              <span className="font-bold text-slate-800">
                <SelectValue placeholder="All Leaders">{selectedLeader === 'ALL' ? 'All Leaders' : selectedLeader}</SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Leaders</SelectItem>
              {leaderOptions.map((leader) => (
                <SelectItem key={leader} value={leader}>
                  {leader}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assessor Filter */}
          <Select value={selectedAssessor} onValueChange={(value) => onSelectedAssessorChange(value || 'ALL')}>
            <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
              <span className="text-slate-400 font-normal">Assessor:</span>
              <span className="font-bold text-slate-800">
                <SelectValue placeholder="All Assessors">
                  {selectedAssessor === 'ALL' ? `All Assessors (${assessorOptions.length})` : selectedAssessor}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Assessors ({assessorOptions.length})</SelectItem>
              {assessorOptions.map((assessor) => (
                <SelectItem key={assessor} value={assessor}>
                  {assessor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pillar Filter */}
          <Select value={selectedPillar} onValueChange={(value) => onSelectedPillarChange(value || 'ALL')}>
            <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
              <span className="text-slate-400 font-normal">Pillar:</span>
              <span className="font-bold text-slate-800">
                <SelectValue placeholder="All Pillars">
                  {selectedPillar === 'ALL'
                    ? `All ${pillarOptions.length} Pillars`
                    : `${selectedPillarObj?.icon ?? ''} ${selectedPillarObj?.label ?? selectedPillar}`}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All {pillarOptions.length} Pillars</SelectItem>
              {pillarOptions.map((pillar) => (
                <SelectItem key={pillar.key} value={pillar.key}>
                  {pillar.icon} {pillar.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Status Filter */}
          <Select
            value={selectedDateStatus}
            onValueChange={(value) => onSelectedDateStatusChange((value as DateStatus | 'ALL') || 'ALL')}
            >
            <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
                <span className="text-slate-400 font-normal">Date Status:</span>
                <span className="font-bold text-slate-800">
                <SelectValue placeholder="All Statuses">
                    {selectedDateStatus === 'ALL'
                    ? `All Statuses (${statusCounts.ALL})`
                    : `${selectedDateStatus.toUpperCase()} (${statusCounts[selectedDateStatus]})`}
                </SelectValue>
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">All Statuses ({statusCounts.ALL})</SelectItem>
                <SelectItem value="yellow">Yellow ({statusCounts.yellow})</SelectItem>
                <SelectItem value="green">Green ({statusCounts.green})</SelectItem>
                <SelectItem value="blue">Blue ({statusCounts.blue})</SelectItem>
                <SelectItem value="orange">Orange ({statusCounts.orange})</SelectItem>
                <SelectItem value="red">Red ({statusCounts.red})</SelectItem>
            </SelectContent>
          </Select>

          {/* Global Search Input */}
          <div className="relative min-w-[180px] flex-1 xl:max-w-[210px]">
            <svg
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search app or leader..."
              className="h-8 pl-8 pr-3 border-slate-200/80 bg-slate-50/80 text-xs text-slate-800 placeholder:text-slate-400 rounded-lg shadow-2xs focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MaturityMatrixFilterBar;
