import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaturityApplication, MaturityPillarDefinition } from '../../../types/maturity-matrix.types';
import {
  getAppMinMaxDates,
  getAppRowIdx,
  getDateHealth,
  getDiffScore,
  getDiffLevel,
} from './maturity-matrix-tab.utils';
import { CellOriginTag } from './MaturityMatrixCellOriginTag';
import { MatrixTable } from './MaturityMatrixTable';
import { CommentaryEditor } from './MaturityMatrixCommentaryEditor';

type MaturityMatrixAppCardProps = {
  app: MaturityApplication;
  index: number;
  pillars: MaturityPillarDefinition[];
  selectedPillar: string;
  showCellOrigins: boolean;
  leaderOptions: string[];
  isExpanded: boolean;
  isEditingNote: boolean;
  noteDraftVal: string;
  onToggleExpand: (code: string) => void;
  onToggleTarget: (appCode: string, pillarKey: string) => void;
  onOriginClick?: (sheet: string, col: string, row: number | string) => void;
  onUpdateLeader: (appCode: string, leader: string) => void;
  onToggleToGenerate: (appCode: string) => void;
  onStartEditNote: (code: string, commentary: string) => void;
  onSaveNote: (code: string) => void;
  onCancelEditNote: (code: string) => void;
  onDraftChange: (code: string, val: string) => void;
};

export function MaturityMatrixAppCard({
  app,
  index,
  pillars,
  selectedPillar,
  showCellOrigins,
  leaderOptions,
  isExpanded,
  isEditingNote,
  noteDraftVal,
  onToggleExpand,
  onToggleTarget,
  onOriginClick,
  onUpdateLeader,
  onStartEditNote,
  onSaveNote,
  onCancelEditNote,
  onDraftChange,
}: MaturityMatrixAppCardProps) {
  const { minDate, maxDate } = getAppMinMaxDates(app.pillars);
  const appKey = app.id || app.code;
  const health = getDateHealth(minDate);
  const rowIdx = getAppRowIdx(app, index);

  const dateRangeDisplay = !minDate ? 'null' : minDate === maxDate ? minDate : `${minDate} → ${maxDate}`;

  const visiblePillars = useMemo(
    () => (selectedPillar === 'ALL' ? pillars : pillars.filter((p) => p.key === selectedPillar)),
    [pillars, selectedPillar],
  );

  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-xs rounded-xl">
      {/* Compact Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 py-1 px-3 flex flex-wrap items-center justify-between gap-2 text-xs min-h-[36px]">
        {/* Left Side Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onToggleExpand(app.code || appKey)}
            className="h-6 w-6 p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors shrink-0 cursor-pointer"
            title={isExpanded ? 'Collapse Application' : 'Expand Application'}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
            </svg>
          </Button>

          <h2 className="text-sm font-bold text-slate-900 tracking-tight shrink-0">
            {app.name}
          </h2>

          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono rounded flex items-center gap-1 shrink-0">
            <span>{app.code}</span>
            <CellOriginTag
              col="D"
              onOriginClick={onOriginClick}
              row={rowIdx}
              sheet="Maturity-Matrix-Projects"
              showCellOrigins={showCellOrigins}
            />
          </span>

          <div className="flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded font-semibold text-[10px] shrink-0">
            <svg
              className="w-3 h-3 text-purple-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle
                cx="12"
                cy="7"
                r="4"
              />
            </svg>
            <span>Leader (Col E):</span>
            <Select
              value={app.leader}
              onValueChange={(newLeader) => {
                if (typeof newLeader === 'string') onUpdateLeader(app.code, newLeader);
              }}
            >
              <SelectTrigger className="h-5 border-purple-200 bg-white/70 text-purple-950 px-1.5 py-0 text-[10px] font-bold shadow-none hover:bg-white min-w-[110px]">
                <SelectValue placeholder={app.leader || 'Select leader'} />
              </SelectTrigger>
              <SelectContent className="min-w-[150px]">
                {leaderOptions.map((leader) => (
                  <SelectItem
                    key={leader}
                    value={leader}
                  >
                    {leader}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CellOriginTag
              col="E"
              onOriginClick={onOriginClick}
              row={rowIdx}
              sheet="Maturity-Matrix-Projects"
              showCellOrigins={showCellOrigins}
            />
          </div>
        </div>

        {/* Right Aligned Assessment Info */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px] shrink-0 ml-auto">
          <span className="flex items-center gap-1">
            <span>Last Assessment:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 cursor-help font-bold ${health.badgeBg}`}
              title={`Assessment Date Range: ${dateRangeDisplay}\nStatus (driven by earliest date ${minDate || 'none'}): ${health.label}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${health.dotColor}`} />
              <span>{dateRangeDisplay}</span>
              <span className="text-[9px] opacity-75 font-sans font-normal">
                ({health.desc})
              </span>
            </span>
          </span>

          <span>•</span>

          <span>
            Previous: <strong className="text-slate-600">{app.prevAssessmentDate || '—'}</strong>
          </span>
        </div>
      </div>

      {/* Collapsed Table Rendering with exact requested header gradient style */}
      {!isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/30 overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-blue-50/90 text-slate-800 font-semibold shadow-2xs border-b border-blue-200/80">
                <th className="py-2 px-3 border-r border-blue-600/20 w-36 sticky left-0 bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wide z-10 shadow-xs">
                  <span className="tracking-wide uppercase text-[11px]">Assessment Type</span>
                </th>
                <th className="py-2 px-2 border-r border-blue-500/20 w-24 text-blue-100 font-bold text-[11px] uppercase tracking-wide">
                  <span className="tracking-wide uppercase text-[11px]">Metric&nbsp;evol.</span>
                </th>
                {visiblePillars.map((p, idx) => {
                  const total = visiblePillars.length;
                  const ratio = total > 1 ? idx / (total - 1) : 0;
                  const textStyle = ratio > 0.65 ? 'text-slate-800 font-bold' : 'text-white font-bold';

                  return (
                    <th
                      key={p.key}
                      className={`py-2 px-3 border-r border-slate-200/40 text-center min-w-[125px] text-[11px] uppercase tracking-wide ${textStyle}`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm">{p.icon}</span>
                        <span className="font-bold tracking-wide uppercase text-[11px]">{p.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10 w-36">
                  Last Assessment
                </td>
                <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px] border-r border-slate-200 w-24 text-center items-center justify-center">
                    Date<br />
                  score&nbsp;/&nbsp;Level
                </td>
                {visiblePillars.map((p) => {
                  const pillarVal = app.pillars[p.key];
                  const pillarHealth = getDateHealth(pillarVal?.date);
                  const diffScore = getDiffScore(pillarVal);
                  const diffLevel = getDiffLevel(pillarVal);

                  let scoreText = '--';
                  let scoreColor = 'text-slate-400';
                  if (diffScore !== null && Math.abs(diffScore) >= 0.001) {
                    if (diffScore > 0) {
                      scoreText = `+${diffScore.toFixed(2)}`;
                      scoreColor = 'text-emerald-600 font-bold';
                    } else if (diffScore < 0) {
                      scoreText = `${diffScore.toFixed(2)}`;
                      scoreColor = 'text-rose-600 font-bold';
                    }
                  }

                  let levelText = '--';
                  let levelColor = 'text-slate-400';
                  if (diffLevel !== null && diffLevel !== 0) {
                    if (diffLevel > 0) {
                      levelText = `+${diffLevel.toFixed(1)}`;
                      levelColor = 'text-emerald-600 font-bold';
                    } else if (diffLevel < 0) {
                      levelText = `${diffLevel.toFixed(1)}`;
                      levelColor = 'text-rose-600 font-bold';
                    }
                  }

                  return (
                    <td
                      key={p.key}
                      className="p-2 border-r border-slate-100 last:border-r-0 text-center align-top bg-white min-w-[125px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        {/* Assessment Date Badge */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded border ${pillarHealth.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pillarHealth.dotColor}`} />
                          <span>{pillarVal?.date || 'null'}</span>
                        </span>

                        {/* Diff score / level evol line */}
                        <div className="flex items-center justify-center gap-1 text-[10px] font-mono mt-0.5">
                          <span className={scoreColor}>{scoreText}</span>
                          <span className="text-slate-300">/</span>
                          <span className={levelColor}>{levelText}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded Table & Commentary */}
      {isExpanded && (
        <div>
          <MatrixTable
            app={app}
            appIndex={index}
            pillars={pillars}
            selectedPillar={selectedPillar}
            showCellOrigins={showCellOrigins}
            onToggleTarget={onToggleTarget}
            onOriginClick={onOriginClick}
          />

          <CommentaryEditor
            appCode={app.code}
            commentary={app.commentary}
            draftVal={noteDraftVal}
            isEditing={isEditingNote}
            onCancel={onCancelEditNote}
            onDraftChange={onDraftChange}
            onSave={onSaveNote}
            onStartEdit={onStartEditNote}
          />
        </div>
      )}
    </div>
  );
}

export default MaturityMatrixAppCard;
