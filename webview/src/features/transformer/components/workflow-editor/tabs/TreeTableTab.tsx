import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Zap, Scissors } from 'lucide-react';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';

interface TreeTableTabProps {
  parsedWorkflow: TransformerWorkflow;
  onSelectVariable?: (variableName: string) => void;
}

export const TreeTableTab: React.FC<TreeTableTabProps> = ({ parsedWorkflow, onSelectVariable }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    anonymization: true,
    extraction: true,
    minify: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col space-y-2 bg-card p-2 w-full h-full overflow-y-auto font-mono text-xs select-none">
      {/* 1. Anonymization Rules */}
      <div className="bg-background border border-border rounded-md overflow-hidden">
        <div
          onClick={() => toggleSection('anonymization')}
          className="flex justify-between items-center bg-muted/30 hover:bg-muted/50 p-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.anonymization ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Anonymization Rules ({parsedWorkflow.anonymizationRules?.length || 0})</span>
          </div>
        </div>

        {expandedSections.anonymization && (
          <div className="space-y-1 p-2 divide-y divide-border/40">
            {(parsedWorkflow.anonymizationRules || []).length === 0 ? (
              <div className="p-1 text-muted-foreground italic">No anonymization rules configured.</div>
            ) : (
              parsedWorkflow.anonymizationRules.map((rule) => {
                const replacementValue = rule.replace ?? rule.replacement;
                return (
                  <div key={rule.id} className="space-y-0.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{rule.name}</span>
                      <span className="bg-emerald-500/10 px-1 py-0.2 border border-emerald-500/20 rounded font-bold text-[9px] text-emerald-500 uppercase">
                        {rule.strategy}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 text-muted-foreground">
                      <span className="truncate">
                        Pattern: <code>{rule.pattern}</code>
                      </span>
                      {replacementValue !== undefined && (
                        <span className="bg-emerald-500/10 px-1 py-0.2 border border-emerald-500/20 rounded font-bold text-[9px] text-emerald-500 uppercase">
                          "{replacementValue}"
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Extraction Steps */}
      <div className="bg-background border border-border rounded-md overflow-hidden">
        <div
          onClick={() => toggleSection('extraction')}
          className="flex justify-between items-center bg-muted/30 hover:bg-muted/50 p-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.extraction ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Zap size={14} className="text-indigo-400" />
            <span>Extraction Steps ({parsedWorkflow.extractionSteps?.length || 0})</span>
          </div>
        </div>

        {expandedSections.extraction && (
          <div className="space-y-1 p-2 divide-y divide-border/40">
            {(parsedWorkflow.extractionSteps || []).length === 0 ? (
              <div className="p-1 text-muted-foreground italic">No extraction steps configured.</div>
            ) : (
              parsedWorkflow.extractionSteps.map((step) => (
                <div key={step.id} className="space-y-0.5 pt-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{step.name}</span>
                    {step.targetVariable && (
                      <span
                        onClick={() => onSelectVariable?.(step.targetVariable!)}
                        data-tooltip={`Click to insert {{${step.targetVariable}}} into template`}
                        className="bg-primary/10 hover:bg-primary/20 px-1 py-0.2 border border-primary/20 rounded text-[9px] text-primary hover:underline transition-colors cursor-pointer select-none"
                      >
                        → ${step.targetVariable}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate">
                    Pattern: <code>{step.pattern}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Minification Settings */}
      <div className="bg-background border border-border rounded-md overflow-hidden">
        <div
          onClick={() => toggleSection('minify')}
          className="flex justify-between items-center bg-muted/30 hover:bg-muted/50 p-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.minify ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Scissors size={14} className="text-amber-500" />
            <span>Minify Options</span>
          </div>
        </div>

        {expandedSections.minify && (
          <div className="space-y-1 p-2 text-[11px]">
            <div className="flex justify-between">
              <span>Strip Comments:</span>
              <strong className={parsedWorkflow.minify?.stripComments ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.stripComments ? 'YES' : 'NO'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Collapse Whitespace:</span>
              <strong className={parsedWorkflow.minify?.collapseWhitespace ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.collapseWhitespace ? 'YES' : 'NO'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Trim Lines:</span>
              <strong className={parsedWorkflow.minify?.trimLines ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.trimLines ? 'YES' : 'NO'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
