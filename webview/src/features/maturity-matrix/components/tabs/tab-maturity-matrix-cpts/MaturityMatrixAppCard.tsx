import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaturityApplication, MaturityPillarDefinition } from '../../../types/maturity-matrix.types';
import { getAppMinMaxDates, getAppRowIdx, getDateHealth, getAppStartRow } from './maturity-matrix-tab.utils';
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
  onToggleToGenerate,
  onStartEditNote,
  onSaveNote,
  onCancelEditNote,
  onDraftChange,
}: MaturityMatrixAppCardProps) {
  const { minDate, maxDate } = getAppMinMaxDates(app.pillars);
  const appKey = app.id || app.code;
  const health = getDateHealth(minDate);
  const rowIdx = getAppRowIdx(app, index);
  const startRow = getAppStartRow(app, index);

  const dateRangeDisplay = !minDate
    ? 'null'
    : minDate === maxDate
      ? minDate
      : `${minDate} → ${maxDate}`;

  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-xl">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onToggleExpand(app.code || appKey)}
            size="sm"
            type="button"
            variant="ghost"
            className="h-7 w-7 p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
            title={isExpanded ? 'Collapse Application' : 'Expand Application'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
            </svg>
          </Button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{app.name}</h2>

              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-mono rounded flex items-center gap-1">
                <span>{app.code}</span>
                <CellOriginTag col="D" onOriginClick={onOriginClick} row={rowIdx} sheet="Maturity-Matrix-Projects" showCellOrigins={showCellOrigins} />
              </span>

              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 border ${
                  app.toGenerate
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>TO GENERATE = {app.toGenerate ? 'TRUE' : 'FALSE'}</span>
                <CellOriginTag col="F" onOriginClick={onOriginClick} row={rowIdx} sheet="Maturity-Matrix-Projects" showCellOrigins={showCellOrigins} />
              </span>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                <svg className="w-3 h-3 text-purple-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Leader (Col E):</span>
                <Select
                  value={app.leader}
                  onValueChange={(newLeader) => {
                    if (typeof newLeader === 'string') onUpdateLeader(app.code, newLeader);
                  }}
                >
                  <SelectTrigger className="h-6 border-purple-200 bg-white/70 text-purple-950 px-2 py-0 text-[11px] font-bold shadow-none hover:bg-white">
                    <SelectValue placeholder={app.leader || 'Select leader'} />
                  </SelectTrigger>
                  <SelectContent className="min-w-[160px]">
                    {leaderOptions.map((leader) => (
                      <SelectItem key={leader} value={leader}>
                        {leader}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CellOriginTag col="E" onOriginClick={onOriginClick} row={rowIdx} sheet="Maturity-Matrix-Projects" showCellOrigins={showCellOrigins} />
              </div>

              <span>•</span>

              <span className="flex items-center gap-1.5">
                <span>Last Assessment:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border flex items-center gap-1.5 cursor-help font-bold ${health.badgeBg}`}
                  title={`Assessment Date Range: ${dateRangeDisplay}\nStatus (driven by earliest date ${minDate || 'none'}): ${health.label}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${health.dotColor}`} />
                  <span>{dateRangeDisplay}</span>
                  <span className="text-[10px] opacity-75 font-sans font-normal">({health.desc})</span>
                </span>
              </span>

              <span>•</span>

              <span>
                Previous: <strong className="text-slate-600">{app.prevAssessmentDate || '—'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={() => onToggleToGenerate(app.code)}
            size="xs"
            type="button"
            variant={app.toGenerate ? 'destructive' : 'default'}
            className="text-xs font-semibold px-2.5 py-1 rounded transition-colors"
            title="Toggle sheet F column 'To Generate'"
          >
            Set TO Generate = {app.toGenerate ? 'FALSE' : 'TRUE'}
          </Button>
        </div>
      </div>

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
