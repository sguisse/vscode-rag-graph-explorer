import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';

export function useWorkflowGraph(workflow: TransformerWorkflow) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [
      { data: { id: 'input', label: '📥 Input Payload', type: 'stage' } },
      { data: { id: 'stage-anon', label: '🔒 Anonymization', type: 'stage' } },
      { data: { id: 'stage-extract', label: '⚡ Extractions', type: 'stage' } },
      { data: { id: 'stage-template', label: '🎨 Templating & Minify', type: 'stage' } },
      { data: { id: 'output', label: `📤 Output (${workflow.outputFormat || 'json'})`, type: 'stage' } },

      { data: { source: 'input', target: 'stage-anon', label: 'Raw Content' } },
      { data: { source: 'stage-anon', target: 'stage-extract', label: 'Anonymized Text' } },
      { data: { source: 'stage-extract', target: 'stage-template', label: 'Extracted Variables' } },
      { data: { source: 'stage-template', target: 'output', label: 'Rendered Result' } },
    ];

    (workflow.anonymizationRules || []).forEach((rule, idx) => {
      const ruleId = `anon-rule-${idx}`;
      elements.push({
        data: {
          id: ruleId,
          label: `${rule.name}\n[${rule.strategy}]`,
          type: 'rule',
        },
      });
      elements.push({
        data: { source: 'stage-anon', target: ruleId, label: 'applies' },
      });
    });

    (workflow.extractionSteps || []).forEach((step, idx) => {
      const stepId = `extract-step-${idx}`;
      elements.push({
        data: {
          id: stepId,
          label: `${step.name}\n→ ${step.targetVariable || 'var'}`,
          type: 'step',
        },
      });
      elements.push({
        data: { source: 'stage-extract', target: stepId, label: 'extracts' },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e293b',
            'border-width': 2,
            'border-color': '#475569',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '10px',
            'font-family': 'monospace',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'width': '130px',
            'height': '40px',
            'shape': 'roundrectangle',
          },
        },
        {
          selector: 'node[type="stage"]',
          style: {
            'background-color': '#312e81',
            'border-color': '#6366f1',
            'font-weight': 'bold',
            'width': '150px',
            'height': '45px',
          },
        },
        {
          selector: 'node[type="rule"]',
          style: {
            'background-color': '#064e3b',
            'border-color': '#10b981',
          },
        },
        {
          selector: 'node[type="step"]',
          style: {
            'background-color': '#701a75',
            'border-color': '#d946ef',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'font-size': '8px',
            'color': '#94a3b8',
            'font-family': 'monospace',
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 20,
        spacingFactor: 1.15,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [workflow]);

  return { containerRef, cyRef };
}
