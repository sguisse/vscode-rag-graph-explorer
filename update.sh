#!/usr/bin/env bash
set -e

TRANSFORMER_TAB_DIR="webview/src/features/transformer/components/workflow-editor/tabs"

mkdir -p "${TRANSFORMER_TAB_DIR}"

# Update TreeTableTab.tsx to render replacement value as a styled badge
cat << 'EOF' > "${TRANSFORMER_TAB_DIR}/TreeTableTab.tsx"
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Zap, Scissors } from 'lucide-react';
import { TransformerWorkflow } from '../../../types/transformer.types';

interface TreeTableTabProps {
  parsedWorkflow: TransformerWorkflow;
}

export const TreeTableTab: React.FC<TreeTableTabProps> = ({ parsedWorkflow }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    anonymization: true,
    extraction: true,
    minify: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full w-full p-2 font-mono text-xs overflow-y-auto space-y-2 bg-card select-none">
      {/* 1. Anonymization Rules */}
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('anonymization')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.anonymization ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Anonymization Rules ({parsedWorkflow.anonymizationRules?.length || 0})</span>
          </div>
        </div>

        {expandedSections.anonymization && (
          <div className="p-2 space-y-1 divide-y divide-border/40">
            {(parsedWorkflow.anonymizationRules || []).length === 0 ? (
              <div className="text-muted-foreground italic p-1">No anonymization rules configured.</div>
            ) : (
              parsedWorkflow.anonymizationRules.map((rule) => {
                const replacementValue = rule.replace ?? rule.replacement;
                return (
                  <div key={rule.id} className="pt-1 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{rule.name}</span>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] uppercase font-bold">
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
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('extraction')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.extraction ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Zap size={14} className="text-indigo-400" />
            <span>Extraction Steps ({parsedWorkflow.extractionSteps?.length || 0})</span>
          </div>
        </div>

        {expandedSections.extraction && (
          <div className="p-2 space-y-1 divide-y divide-border/40">
            {(parsedWorkflow.extractionSteps || []).length === 0 ? (
              <div className="text-muted-foreground italic p-1">No extraction steps configured.</div>
            ) : (
              parsedWorkflow.extractionSteps.map((step) => (
                <div key={step.id} className="pt-1 text-[11px] space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{step.name}</span>
                    {step.targetVariable && (
                      <span className="bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded text-[9px]">
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
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('minify')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.minify ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Scissors size={14} className="text-amber-500" />
            <span>Minify Options</span>
          </div>
        </div>

        {expandedSections.minify && (
          <div className="p-2 text-[11px] space-y-1">
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
EOF

# Build Webview Application
cd webview && npm run build

echo "✅ UI update: Styled anonymization replacement values with styled emerald badge in TreeTableTab!"
