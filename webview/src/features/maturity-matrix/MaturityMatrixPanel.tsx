import React, { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { maturityMatrixApiService } from '@/services/api/maturity-matrix-api.service.gen';
import { MaturityMatrixResult } from '@/shared/services/maturity-matrix';

const EMPTY_RESULT: MaturityMatrixResult = {
  label: 'Not started',
  generatedAt: '',
  message: 'No extraction run yet.',
  rows: [['status', 'message'], ['pending', 'No extraction run yet.']],
};

function formatCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function MaturityMatrixPanel() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [lastExtractDone, setLastExtractDone] = useState<string>('Not run yet');
  const [assessments, setAssessments] = useState<MaturityMatrixResult>(EMPTY_RESULT);
  const [maturityMatrix, setMaturityMatrix] = useState<MaturityMatrixResult>(EMPTY_RESULT);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(75, Math.max(25, relativeX));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleExtractAll = async () => {
    setIsRunning(true);

    try {
      const [assessmentsResult, maturityResult] = await Promise.all([
        maturityMatrixApiService.extractAssessments(),
        maturityMatrixApiService.extractMaturityMatrix(),
      ]);

      setAssessments(assessmentsResult);
      setMaturityMatrix(maturityResult);
      setLastExtractDone(new Date().toLocaleString());
    } catch (error) {
      const fallbackMessage = String(error instanceof Error ? error.message : error);
      setAssessments({
        ...EMPTY_RESULT,
        label: 'Assessments',
        message: fallbackMessage,
        rows: [['status', 'message'], ['error', fallbackMessage]],
      });
      setMaturityMatrix({
        ...EMPTY_RESULT,
        label: 'Maturity Matrix',
        message: fallbackMessage,
        rows: [['status', 'message'], ['error', fallbackMessage]],
      });
      setLastExtractDone('Failed');
    } finally {
      setIsRunning(false);
    }
  };

  const renderCsvPanel = (title: string, result: MaturityMatrixResult, tone: 'primary' | 'secondary') => (
    <div className="flex flex-col min-h-0 h-full border border-border rounded-xl bg-background/40 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-indigo-500/10 text-indigo-400'}`}>
            {tone === 'primary' ? <Activity size={14} /> : <CheckCircle2 size={14} />}
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-foreground">{title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {result.generatedAt ? new Date(result.generatedAt).toLocaleString() : 'waiting'}
        </span>
      </div>

      <div className="flex-1 min-h-0 p-3 overflow-auto">
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-foreground/90">
          {formatCsv(result.rows && result.rows.length ? result.rows : [['status', 'message'], ['pending', result.message]])}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 px-3 py-3">
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles size={12} />
              <span>Maturity Matrix</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Local Git refresh and extraction workflow
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Reset the repository to the main branch, discard local drift, pull the latest base state, then extract the current assessments and maturity matrix output.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="default"
              className="gap-2 font-semibold cursor-pointer"
              onClick={handleExtractAll}
              disabled={isRunning}
            >
              {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {isRunning ? 'Running extraction...' : 'Extract ALL'}
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="font-mono uppercase tracking-[0.14em] text-foreground">Last extract</span>
              <span>{lastExtractDone}</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={panelRef} className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
        <div style={{ width: `${splitRatio}%` }} className="min-w-0 pr-2">
          {renderCsvPanel('Assessments', assessments, 'primary')}
        </div>

        <div
          className="w-2 cursor-col-resize rounded-full bg-border hover:bg-primary/70 transition-colors"
          onMouseDown={() => setIsDragging(true)}
        />

        <div style={{ width: `${100 - splitRatio}%` }} className="min-w-0 pl-2">
          {renderCsvPanel('Maturity Matrix', maturityMatrix, 'secondary')}
        </div>
      </div>
    </div>
  );
}

export default MaturityMatrixPanel;
