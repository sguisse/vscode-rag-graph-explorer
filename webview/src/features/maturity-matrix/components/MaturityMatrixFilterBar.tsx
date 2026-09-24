import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaturityMatrixLegend } from './MaturityMatrixLegend';
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
  onExpandAll,
  onCollapseAll,
}: MaturityMatrixFilterBarProps) {
  const tabs: Array<{ key: MaturityMatrixTabId; label: string; icon: React.ReactNode }> = [
    {
      key: 'matrix',
      label: 'Maturity Matrix View',
      icon: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
          />
        </svg>
      ),
    },
    {
      key: 'compare',
      label: 'Pillar Delta Analytics',
      icon: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line
            x1="18"
            y1="20"
            x2="18"
            y2="10"
          />
          <line
            x1="12"
            y1="20"
            x2="12"
            y2="4"
          />
          <line
            x1="6"
            y1="20"
            x2="6"
            y2="14"
          />
        </svg>
      ),
    },
    {
      key: 'extracts',
      label: 'Extracts & Assessors',
      icon: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      key: 'speedrun',
      label: 'Assessment Speedrun 🏎️',
      icon: (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  const selectedPillarObj = pillarOptions.find((p) => p.key === selectedPillar);

  const handleResetFilters = () => {
    onSelectedLeaderChange('ALL');
    onSelectedAssessorChange('ALL');
    onSelectedPillarChange('ALL');
    onSelectedDateStatusChange('ALL');
    onSearchQueryChange('');
  };

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/60 self-start">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedLeader}
              onValueChange={(value) => onSelectedLeaderChange(value || 'ALL')}
            >
              <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
                <span className="text-slate-400 font-normal">Leader:</span>
                <span className="font-bold text-slate-800">
                  <SelectValue placeholder="All Leaders">{selectedLeader === 'ALL' ? 'All Leaders' : selectedLeader}</SelectValue>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  All Leaders
                </SelectItem>
                {leaderOptions.map((leader) => (
                  <SelectItem key={leader} value={leader}>
                    {leader}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAssessor}
              onValueChange={(value) => onSelectedAssessorChange(value || 'ALL')}
            >
              <SelectTrigger className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-2xs w-auto gap-1 focus:ring-1 focus:ring-indigo-500">
                <span className="text-slate-400 font-normal">Assessor:</span>
                <span className="font-bold text-slate-800">
                  <SelectValue placeholder="All Assessors">
                    {selectedAssessor === 'ALL' ? `All Assessors (${assessorOptions.length})` : selectedAssessor}
                  </SelectValue>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  All Assessors ({assessorOptions.length})
                </SelectItem>
                {assessorOptions.map((assessor) => (
                  <SelectItem key={assessor} value={assessor}>
                    {assessor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedPillar}
              onValueChange={(value) => onSelectedPillarChange(value || 'ALL')}
            >
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
                <SelectItem value="ALL">
                  All {pillarOptions.length} Pillars
                </SelectItem>
                {pillarOptions.map((pillar) => (
                  <SelectItem key={pillar.key} value={pillar.key}>
                    {pillar.icon} {pillar.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>
              <Input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search app or leader..."
                className="h-8 pl-8 pr-3 border-slate-200/80 bg-slate-50/80 text-xs text-slate-800 placeholder:text-slate-400 rounded-lg shadow-2xs focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>

            <Button className="h-8 border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs text-slate-700 font-semibold px-3 rounded-lg shadow-2xs gap-1.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer" onClick={handleResetFilters} size="sm" title="Reset all filters" type="button" variant="outline">
              <svg
                className="h-3.5 w-3.5 shrink-0 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset All</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end w-full">
          <MaturityMatrixLegend
          onCollapseAll={onCollapseAll}
          onExpandAll={onExpandAll}
          statusCounts={statusCounts}
          onStatusClick={onSelectedDateStatusChange}
          selectedDateStatus={selectedDateStatus} />
        </div>
      </div>
    </section>
  );
}

export default MaturityMatrixFilterBar;
