import { useMemo, useState } from 'react';
import { useMaturityMatrixStore } from '../../store/useMaturityMatrixStore';
import type { MaturityApplication } from '../../types/maturity-matrix.types';
import { DEFAULT_PILLARS } from './tab-maturity-matrix-cpts/maturity-matrix-tab.utils';
import { MaturityMatrixAppCard } from './tab-maturity-matrix-cpts/MaturityMatrixAppCard';

interface MaturityMatrixTabProps {
  applications: MaturityApplication[];
  onOriginClick?: (sheet: string, col: string, row: number | string) => void;
}

export function MaturityMatrixTab({ applications, onOriginClick }: MaturityMatrixTabProps) {
  const showCellOrigins = useMaturityMatrixStore((s) => s.showCellOrigins);
  const selectedPillar = useMaturityMatrixStore((s) => s.selectedPillar);
  const storePillars = useMaturityMatrixStore((s) => s.data.pillars);
  const storeApplications = useMaturityMatrixStore((s) => s.data.applications);
  const expandedAppCodes = useMaturityMatrixStore((s) => s.expandedAppCodes);
  const toggleExpandApp = useMaturityMatrixStore((s) => s.toggleExpandApp);

  const updateLeader = useMaturityMatrixStore((s) => s.updateLeader);
  const toggleToGenerate = useMaturityMatrixStore((s) => s.toggleToGenerate);
  const toggleTarget = useMaturityMatrixStore((s) => s.toggleTarget);
  const updateCommentary = useMaturityMatrixStore((s) => s.updateCommentary);

  const pillars = storePillars && storePillars.length > 0 ? storePillars : DEFAULT_PILLARS;

  const leaderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          storeApplications
            .map((app) => app.leader)
            .filter((leader): leader is string => Boolean(leader && leader !== '-')),
        ),
      ).sort(),
    [storeApplications],
  );

  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const handleStartEditNote = (code: string, commentary: string) => {
    setEditingNotes((prev) => ({ ...prev, [code]: true }));
    setNotesDraft((prev) => ({ ...prev, [code]: commentary || '' }));
  };

  const handleSaveNote = (code: string) => {
    const val = notesDraft[code] ?? '';
    updateCommentary(code, val);
    setEditingNotes((prev) => ({ ...prev, [code]: false }));
  };

  const handleCancelEditNote = (code: string) => {
    setEditingNotes((prev) => ({ ...prev, [code]: false }));
  };

  const handleDraftChange = (code: string, val: string) => {
    setNotesDraft((prev) => ({ ...prev, [code]: val }));
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No applications match the current filters.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {applications.map((app, index) => {
        const appKey = app.id || app.code;
        const isExpanded = Boolean(expandedAppCodes[app.code] ?? expandedAppCodes[appKey] ?? false);
        const isEditingNote = Boolean(editingNotes[app.code] || editingNotes[appKey]);
        const noteDraftVal = notesDraft[app.code] ?? notesDraft[appKey] ?? app.commentary ?? '';

        return (
          <MaturityMatrixAppCard app={app} index={index} isEditingNote={isEditingNote} isExpanded={isExpanded} key={appKey} leaderOptions={leaderOptions} noteDraftVal={noteDraftVal} onCancelEditNote={handleCancelEditNote} onDraftChange={handleDraftChange} onOriginClick={onOriginClick} onSaveNote={handleSaveNote} onStartEditNote={handleStartEditNote} onToggleExpand={toggleExpandApp} onToggleTarget={toggleTarget} onToggleToGenerate={toggleToGenerate} onUpdateLeader={updateLeader} pillars={pillars} selectedPillar={selectedPillar} showCellOrigins={showCellOrigins}/>
        );
      })}
    </section>
  );
}

export default MaturityMatrixTab;