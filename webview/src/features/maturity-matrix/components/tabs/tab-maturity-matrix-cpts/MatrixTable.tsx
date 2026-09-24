import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MaturityApplication, MaturityPillarDefinition } from '../../../types/maturity-matrix.types';
import {
  getAppStartRow,
  getDiffLevel,
  getDiffScore,
  getDateHealth,
} from './maturity-matrix-tab.utils';
import { CellOriginTag } from './MaturityMatrixCellOriginTag';

type MatrixTableProps = {
  app: MaturityApplication;
  pillars: MaturityPillarDefinition[];
  selectedPillar: string;
  showCellOrigins: boolean;
  onToggleTarget: (appCode: string, pillarKey: string) => void;
  onOriginClick?: (sheet: string, col: string, row: number | string) => void;
  appIndex: number;
};

export function MatrixTable({
  app,
  pillars,
  selectedPillar,
  showCellOrigins,
  onToggleTarget,
  onOriginClick,
  appIndex,
}: MatrixTableProps) {
  const visiblePillars = useMemo(
    () => (selectedPillar === 'ALL' ? pillars : pillars.filter((p) => p.key === selectedPillar)),
    [pillars, selectedPillar],
  );

  const startRow = getAppStartRow(app, appIndex);
  const [isExtractsExpanded, setIsExtractsExpanded] = useState(false);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-r from-blue-1000 to-blue-50/90 text-slate-800 font-semibold shadow-2xs border-b border-blue-200/80">
            <th className="py-2 px-3 border-r border-blue-600/20 w-36 sticky left-0 bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wide z-10 shadow-xs">
              <span className="tracking-wide uppercase text-[11px]">Assessment Type fff</span>
            </th>
            <th className="py-2 px-2 border-r border-blue-500/20 w-24 text-blue-100 font-bold text-[11px] uppercase tracking-wide">
              <span className="tracking-wide uppercase text-[11px]">Metricddd&nbsp;evol.</span>
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
                    <span className="text-base">{p.icon}</span>
                    <span className="font-bold tracking-wide uppercase text-[11px]">{p.label}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr className="bg-amber-50/50 hover:bg-amber-50/80 transition-colors">
            <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-amber-50/90 z-10">
              Expected Target
            </td>
            <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px] border-r border-slate-200">Target ⬆️</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const isTargetActive = Boolean(pillarVal?.target);
              return (
                <td
                  key={p.key}
                  className="py-2.5 px-3 text-center border-r border-slate-200"
                >
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => onToggleTarget(app.code, p.key)}
                    className={
                      isTargetActive
                        ? 'bg-amber-400 text-amber-950 font-bold hover:bg-amber-500 scale-105 shadow-sm h-6 px-2.5 text-xs'
                        : 'border border-slate-300 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-semibold h-6 px-2.5 text-xs'
                    }
                    title={isTargetActive ? 'Target Improvement Indicator is Active (Click to remove)' : 'Click to mark pillar target ⬆️'}
                  >
                    {isTargetActive ? '⬆️ TARGET' : '+ Target'}
                  </Button>
                </td>
              );
            })}
          </tr>

          <tr className="hover:bg-slate-50">
            <td
              rowSpan={3}
              className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10"
            >
              Last Assessment
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">Compared to TODAY</div>
              <div className="text-[9px] text-indigo-500 font-mono font-medium mt-0.5">💡 hover for origin</div>
            </td>
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Date</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const cellRow = startRow + p.rowOffset + 1;
              const health = getDateHealth(pillarVal?.date);

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center border-r border-slate-200 cursor-help transition-colors hover:bg-indigo-50/30"
                  title={`'Assessments-Extracts'!E${cellRow} [Column E : Row ${cellRow}] • Last Assessment Date | Current Value: ${pillarVal?.date || 'null'}\nStatus: ${health.label}`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded border ${health.badgeBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${health.dotColor}`} />
                      <span>{pillarVal?.date || 'null'}</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">{health.desc}</span>
                    <CellOriginTag
                      col="E"
                      sheet="Assessments-Extracts"
                      row={cellRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr className="hover:bg-slate-50">
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Score</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const cellRow = startRow + p.rowOffset + 1;
              const diffScore = getDiffScore(pillarVal);

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center border-r border-slate-200 cursor-help transition-colors hover:bg-indigo-50/30"
                  title={`'Assessments-Extracts'!G${cellRow} [Column G : Row ${cellRow}] • Last Assessment Score | Current Value: ${Number(pillarVal?.score ?? 0).toFixed(2)}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{Number(pillarVal?.score ?? 0).toFixed(2)}</span>
                      {diffScore !== null && Math.abs(diffScore) >= 0.01 && (
                        <span className={`text-[11px] font-bold ${diffScore > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diffScore > 0 ? `+${diffScore.toFixed(2)}` : diffScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <CellOriginTag
                      col="G"
                      sheet="Assessments-Extracts"
                      row={cellRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr className="hover:bg-slate-50 border-b border-slate-300">
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Level</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const levelRow = startRow + p.rowOffset + 2;
              const diffLevel = getDiffLevel(pillarVal);

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center border-r border-slate-200 cursor-help transition-colors hover:bg-indigo-50/30"
                  title={`'Assessments-Extracts'!G${levelRow} [Column G : Row ${levelRow}] • Last Assessment Level | Current Value: ${pillarVal?.level || 'Lvl 0'}`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge
                        variant="default"
                        className="text-[11px] py-0.5 px-2.5"
                      >
                        {pillarVal?.level || 'Lvl 0'}
                      </Badge>
                      {diffLevel !== null && diffLevel !== 0 && (
                        <span className={`text-[10px] font-bold ${diffLevel > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diffLevel > 0 ? `+${diffLevel}` : diffLevel}
                        </span>
                      )}
                    </div>
                    <CellOriginTag
                      col="G"
                      sheet="Assessments-Extracts"
                      row={levelRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr className="bg-slate-50/70 hover:bg-slate-100/70">
            <td
              rowSpan={3}
              className="py-2 px-3 font-semibold text-slate-600 border-r border-slate-200 sticky left-0 bg-slate-50/90 z-10"
            >
              Last Assessment - 1
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">Previous Session</div>
            </td>
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Date</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const prevRow = startRow + p.rowOffset + 3;

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200 cursor-help hover:bg-slate-200/50"
                  title={`'Assessments-Extracts'!E${prevRow} [Column E : Row ${prevRow}] • Last Assessment - 1 Date | Current Value: ${pillarVal?.prevDate || 'null'}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span>{pillarVal?.prevDate || '—'}</span>
                    <CellOriginTag
                      col="E"
                      sheet="Assessments-Extracts"
                      row={prevRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr className="bg-slate-50/70 hover:bg-slate-100/70">
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Score</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const prevRow = startRow + p.rowOffset + 3;

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center text-slate-600 font-semibold border-r border-slate-200 cursor-help hover:bg-slate-200/50"
                  title={`'Assessments-Extracts'!G${prevRow} [Column G : Row ${prevRow}] • Last Assessment - 1 Score | Current Value: ${Number(pillarVal?.prevScore ?? 0).toFixed(2)}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span>{Number(pillarVal?.prevScore ?? 0).toFixed(2)}</span>
                    <CellOriginTag
                      col="G"
                      sheet="Assessments-Extracts"
                      row={prevRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr className="bg-slate-50/70 hover:bg-slate-100/70 border-b-2 border-indigo-100">
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Level</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const prevLevelRow = startRow + p.rowOffset + 4;

              return (
                <td
                  key={p.key}
                  className="py-2 px-3 text-center text-slate-500 font-semibold border-r border-slate-200 cursor-help hover:bg-slate-200/50"
                  title={`'Assessments-Extracts'!G${prevLevelRow} [Column G : Row ${prevLevelRow}] • Last Assessment - 1 Level | Current Value: ${pillarVal?.prevLevel || 'Lvl 0'}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span>{pillarVal?.prevLevel || 'Lvl 0'}</span>
                    <CellOriginTag
                      col="G"
                      sheet="Assessments-Extracts"
                      row={prevLevelRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          <tr
            onClick={() => setIsExtractsExpanded((prev) => !prev)}
            className="bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-semibold cursor-pointer transition-colors select-none"
          >
            <td
              colSpan={visiblePillars.length + 2}
              className="py-1.5 px-3 text-[11px] uppercase tracking-wider text-slate-600"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md text-slate-500 hover:text-slate-800 transition-colors">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polyline points={isExtractsExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                  </svg>
                </span>
                <span>New Pending Assessment Follow-up (Extract Progression)</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">
                  ({isExtractsExpanded ? 'click to collapse' : 'click to expand progression details'})
                </span>
              </div>
            </td>
          </tr>

          <tr className="hover:bg-slate-50">
            <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10">
              Assessor
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">Extracts Col C</div>
            </td>
            <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200 text-[11px]">Assessor</td>
            {visiblePillars.map((p) => {
              const pillarVal = app.pillars[p.key];
              const assessorRow = startRow + p.rowOffset;
              const assessorName = pillarVal?.assessor || '-';
              const hasOwner = Boolean(assessorName && assessorName !== '-');

              return (
                <td
                  key={p.key}
                  className="py-2 px-2 text-center text-[11px] text-slate-700 font-medium border-r border-slate-200 cursor-help hover:bg-indigo-50/30"
                  title={`'Assessments-Extracts'!C${assessorRow} [Column C : Row ${assessorRow}] • Assessor / Owner | Current Value: ${assessorName}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-[130px] ${
                        hasOwner
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'
                      }`}
                    >
                      {assessorName}
                    </span>
                    <CellOriginTag
                      col="C"
                      sheet="Assessments-Extracts"
                      row={assessorRow}
                      showCellOrigins={showCellOrigins}
                      onOriginClick={onOriginClick}
                      className="mt-0.5"
                    />
                  </div>
                </td>
              );
            })}
          </tr>

          {isExtractsExpanded && (
            <>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-white z-10">
                  Last extract
                  <div className="text-[10px] text-slate-400 font-normal">2025-05-11</div>
                </td>
                <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Progress</td>
                {visiblePillars.map((p) => {
                  const pillarVal = app.pillars[p.key];
                  const lastExtractRow = startRow + p.rowOffset + 5;
                  const prog = Math.round(Number(pillarVal?.lastExtract ?? 0));

                  return (
                    <td
                      key={p.key}
                      className="py-2 px-3 border-r border-slate-200 cursor-help hover:bg-indigo-50/30"
                      title={`'Assessments-Extracts'!G${lastExtractRow} [Column G : Row ${lastExtractRow}] • Last Pending Assessment Snapshot Progress | Current Value: ${prog}%`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-slate-900 text-xs">{prog}%</span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prog === 100 ? 'bg-emerald-500' : prog > 0 ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                        <CellOriginTag
                          col="G"
                          sheet="Assessments-Extracts"
                          row={lastExtractRow}
                          showCellOrigins={showCellOrigins}
                          onOriginClick={onOriginClick}
                          className="mt-0.5"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 font-semibold text-slate-600 border-r border-slate-200 sticky left-0 bg-white z-10">
                  Previous extract
                  <div className="text-[10px] text-slate-400 font-normal">2025-04-11</div>
                </td>
                <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200">Progress</td>
                {visiblePillars.map((p) => {
                  const pillarVal = app.pillars[p.key];
                  const prevExtractRow = startRow + p.rowOffset + 6;
                  const prevProg = Math.round(Number(pillarVal?.prevExtract ?? 0));

                  return (
                    <td
                      key={p.key}
                      className="py-2 px-3 text-center text-slate-500 border-r border-slate-200 cursor-help hover:bg-slate-200/50"
                      title={`'Assessments-Extracts'!G${prevExtractRow} [Column G : Row ${prevExtractRow}] • Previous Pending Assessment Snapshot Progress | Current Value: ${prevProg}%`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span>{prevProg}%</span>
                        <CellOriginTag
                          col="G"
                          sheet="Assessments-Extracts"
                          row={prevExtractRow}
                          showCellOrigins={showCellOrigins}
                          onOriginClick={onOriginClick}
                          className="mt-0.5"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr className="bg-slate-50 font-bold">
                <td className="py-2 px-3 text-slate-800 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Filled Progress Indicator</td>
                <td className="py-2 px-2 text-slate-500 font-medium border-r border-slate-200 text-[10px]">Trend</td>
                {visiblePillars.map((p) => {
                  const pillarVal = app.pillars[p.key];
                  const curr = Math.round(Number(pillarVal?.lastExtract ?? 0));
                  const prev = Math.round(Number(pillarVal?.prevExtract ?? 0));

                  let trendIcon = '➡️';
                  let trendColor = 'text-slate-600 bg-slate-100';
                  let trendLabel = 'No Change';

                  if (curr === 100) {
                    trendIcon = '✅';
                    trendColor = 'text-emerald-700 bg-emerald-50';
                    trendLabel = 'Finished';
                  } else if (curr > prev) {
                    trendIcon = '↗️';
                    trendColor = 'text-emerald-700 bg-emerald-50';
                    trendLabel = 'Improved';
                  } else if (curr < prev) {
                    trendIcon = '↘️';
                    trendColor = 'text-rose-700 bg-rose-50';
                    trendLabel = 'Degraded';
                  }

                  const cellG1 = startRow + p.rowOffset + 5;
                  const cellG2 = startRow + p.rowOffset + 6;

                  return (
                    <td
                      key={p.key}
                      className="py-2 px-3 text-center border-r border-slate-200 cursor-help"
                      title={`Trend: ${trendLabel}\nCompared from 'Assessments-Extracts'!G${cellG1} vs G${cellG2}`}
                    >
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs ${trendColor}`}>{trendIcon}</span>
                    </td>
                  );
                })}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MatrixTable;
