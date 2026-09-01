import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { Plus, Minus, Focus, LayoutGrid, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { TransformerWorkflow } from '@/shared/services/transform-content/model/transform-content-model';


// Constantes de structuration et de disposition géométrique
const SUB_PROCESS_PADDING = 5; // Padding interne de 5px
const SUB_PROCESS_SPACING = 40; // Espacement de 40px entre conteneurs
const STEP_NODE_WIDTH = 200;
const STEP_NODE_HEIGHT = 68;
const INTRA_STEP_GAP = 18;
const START_X = 120;
const START_Y = 80;

interface GraphDesignTabProps {
  parsedWorkflow: TransformerWorkflow;
}

export const GraphDesignTab: React.FC<GraphDesignTabProps> = ({ parsedWorkflow }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('TB');

  // Détection dynamique du thème Clair / Sombre
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

// Palette de couleurs pastel explicite pour Cytoscape
const themeColors = useMemo(() => {
  if (isDarkMode) {
    return {
      // Mode Sombre (Pastels lumineux & Contraste lisible)
      // Block 1: Déclinaison Bleu
      sub1Bg: 'rgba(59, 130, 246, 0.12)',
      sub1Border: '#60a5fa',
      sub1Text: '#93c5fd',

      // Block 2: Pastel Ambre / Pêche
      sub2Bg: 'rgba(245, 158, 11, 0.12)',
      sub2Border: '#fbbf24',
      sub2Text: '#fcd34d',

      // Block 3: Pastel Menthe / Émeraude
      sub3Bg: 'rgba(16, 185, 129, 0.12)',
      sub3Border: '#34d399',
      sub3Text: '#6ee7b7',

      // Étapes
      step1Bg: '#1e3a8a',
      step1Border: '#60a5fa',
      step1Text: '#eff6ff',

      step2Bg: '#78350f',
      step2Border: '#fbbf24',
      step2Text: '#fffbeb',

      step3Bg: '#064e3b',
      step3Border: '#34d399',
      step3Text: '#ecfdf5',

      edgeColor: '#93c5fd',
    };
  } else {
    return {
      // Mode Clair (Pastels doux)
      // Block 1: Déclinaison Bleu
      sub1Bg: '#f0f9ff',
      sub1Border: '#93c5fd',
      sub1Text: '#1d4ed8',

      // Block 2: Pastel Jaune / Ambre
      sub2Bg: '#fffbeb',
      sub2Border: '#fde047',
      sub2Text: '#b45309',

      // Block 3: Pastel Menthe / Vert
      sub3Bg: '#ecfdf5',
      sub3Border: '#6ee7b7',
      sub3Text: '#047857',

      // Étapes
      step1Bg: '#dbeafe',
      step1Border: '#3b82f6',
      step1Text: '#1e3a8a',

      step2Bg: '#fef3c7',
      step2Border: '#f59e0b',
      step2Text: '#78350f',

      step3Bg: '#d1fae5',
      step3Border: '#10b981',
      step3Text: '#064e3b',

      edgeColor: '#60a5fa',
    };
  }
}, [isDarkMode]);



  // Construction des nœuds BPMN et étapes avec respect des 5px de padding et 40px d'écartement
  const elements = useMemo(() => {
    const isHorizontal = orientation === 'LR';
    const anonRules = (parsedWorkflow.anonymizationRules || []).filter((r) => r.enabled);
    const extractSteps = (parsedWorkflow.extractionSteps || []).filter((s) => s.enabled);

    // Conteneurs sous-processus BPMN
    const bpmnSubProcesses = [
      {
        id: 'bpmn-sub-ingest-sanitize',
        label: 'SUB-PROCESS 1: INGESTION & SANITIZATION',
        class: 'sub-process-parent sub-1',
      },
      {
        id: 'bpmn-sub-extract-structure',
        label: 'SUB-PROCESS 2: EXTRACTION & STRUCTURING',
        class: 'sub-process-parent sub-2',
      },
      {
        id: 'bpmn-sub-synthesis-delivery',
        label: 'SUB-PROCESS 3: OUTPUT SYNTHESIS & DELIVERY',
        class: 'sub-process-parent sub-3',
      },
    ];

    // Calcul des positions garantissant 40px d'écartement entre les sous-processus
    const x1 = START_X;
    const y1 = START_Y;

    let x2 = START_X;
    let y2 = START_Y;

    let x3 = START_X;
    let y3 = START_Y;

    if (isHorizontal) {
      const sub1SpanX = 2 * STEP_NODE_WIDTH + INTRA_STEP_GAP;
      x2 = x1 + sub1SpanX + 2 * SUB_PROCESS_PADDING + SUB_PROCESS_SPACING;

      const sub2SpanX = STEP_NODE_WIDTH;
      x3 = x2 + sub2SpanX + 2 * SUB_PROCESS_PADDING + SUB_PROCESS_SPACING;
    } else {
      const sub1SpanY = 2 * STEP_NODE_HEIGHT + INTRA_STEP_GAP;
      y2 = y1 + sub1SpanY + 2 * SUB_PROCESS_PADDING + SUB_PROCESS_SPACING;

      const sub2SpanY = STEP_NODE_HEIGHT;
      y3 = y2 + sub2SpanY + 2 * SUB_PROCESS_PADDING + SUB_PROCESS_SPACING;
    }

    // Définition du contenu formraté
    const stepNodes = [
      // Sub-Process 1 Steps
      {
        id: 'step-ingestion',
        parent: 'bpmn-sub-ingest-sanitize',
        label: '📥 Step 1.1\nIngestion Payload\nRaw Stream Data',
        x: x1,
        y: y1,
        class: 'step-child-node step-1',
      },
      {
        id: 'step-anonymization',
        parent: 'bpmn-sub-ingest-sanitize',
        label: `🛡️ Step 1.2\nPII Anonymizer\nRules: ${anonRules.length}\nActive [${anonRules.map((r) => r.strategy).join(', ') || 'None'}]`,
        x: isHorizontal ? x1 + STEP_NODE_WIDTH + INTRA_STEP_GAP : x1,
        y: isHorizontal ? y1 : y1 + STEP_NODE_HEIGHT + INTRA_STEP_GAP,
        class: 'step-child-node step-1',
      },

      // Sub-Process 2 Steps
      {
        id: 'step-extraction',
        parent: 'bpmn-sub-extract-structure',
        label: `🔍 Step 2.1\nRegex Extractor\nSteps: ${extractSteps.length}\nVars [${extractSteps.map((s) => s.targetVariable).filter(Boolean).join(', ') || 'None'}]`,
        x: x2,
        y: y2,
        class: 'step-child-node step-2',
      },

      // Sub-Process 3 Steps
      {
        id: 'step-templating',
        parent: 'bpmn-sub-synthesis-delivery',
        label: `🧩 Step 3.1\nMustache Interpolator\nFormat: ${(parsedWorkflow.outputFormat || 'json').toUpperCase()}`,
        x: x3,
        y: y3,
        class: 'step-child-node step-3',
      },
      {
        id: 'step-minifier',
        parent: 'bpmn-sub-synthesis-delivery',
        label: `✂️ Step 3.2\nMinification & Render\n${parsedWorkflow.minify?.collapseWhitespace ? 'Whitespace Collapsed' : 'Preserve Whitespace'}`,
        x: isHorizontal ? x3 + STEP_NODE_WIDTH + INTRA_STEP_GAP : x3,
        y: isHorizontal ? y3 : y3 + STEP_NODE_HEIGHT + INTRA_STEP_GAP,
        class: 'step-child-node step-3',
      },
    ];

    // Connecteurs du flux
    const edges = [
      { id: 'e1', source: 'step-ingestion', target: 'step-anonymization' },
      { id: 'e2', source: 'step-anonymization', target: 'step-extraction' },
      { id: 'e3', source: 'step-extraction', target: 'step-templating' },
      { id: 'e4', source: 'step-templating', target: 'step-minifier' },
    ];

    return [
      ...bpmnSubProcesses.map((sub) => ({
        data: { id: sub.id, label: sub.label },
        classes: sub.class,
      })),
      ...stepNodes.map((n) => ({
        data: { id: n.id, parent: n.parent, label: n.label },
        position: { x: n.x, y: n.y },
        classes: n.class,
      })),
      ...edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target },
      })),
    ];
  }, [parsedWorkflow, orientation]);

  // Initialisation Cytoscape avec la palette de couleurs explicite
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        // Base Conteneurs Sous-Processus
        {
          selector: 'node.sub-process-parent',
          style: {
            shape: 'round-rectangle',
            'border-width': 1.5,
            'border-style': 'dashed',
            label: 'data(label)',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': -8,
            'font-family': 'monospace',
            'font-size': '9.5px',
            'font-weight': 'bold',
            padding: `${SUB_PROCESS_PADDING}px`,
          },
        },
        // Couleurs Sub-Process 1
        {
          selector: 'node.sub-process-parent.sub-1',
          style: {
            'background-color': themeColors.sub1Bg,
            'border-color': themeColors.sub1Border,
            color: themeColors.sub1Text,
          },
        },
        // Couleurs Sub-Process 2
        {
          selector: 'node.sub-process-parent.sub-2',
          style: {
            'background-color': themeColors.sub2Bg,
            'border-color': themeColors.sub2Border,
            color: themeColors.sub2Text,
          },
        },
        // Couleurs Sub-Process 3
        {
          selector: 'node.sub-process-parent.sub-3',
          style: {
            'background-color': themeColors.sub3Bg,
            'border-color': themeColors.sub3Border,
            color: themeColors.sub3Text,
          },
        },

        // Base Étapes
        {
          selector: 'node.step-child-node',
          style: {
            shape: 'round-rectangle',
            width: STEP_NODE_WIDTH,
            height: STEP_NODE_HEIGHT,
            'border-width': 1.5,
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'font-family': 'monospace',
            'font-size': '10px',
            'font-weight': 'bold',
            'line-height': 1.25,
          },
        },
        // Couleurs Nœuds Étape 1
        {
          selector: 'node.step-child-node.step-1',
          style: {
            'background-color': themeColors.step1Bg,
            'border-color': themeColors.step1Border,
            color: themeColors.step1Text,
          },
        },
        // Couleurs Nœuds Étape 2
        {
          selector: 'node.step-child-node.step-2',
          style: {
            'background-color': themeColors.step2Bg,
            'border-color': themeColors.step2Border,
            color: themeColors.step2Text,
          },
        },
        // Couleurs Nœuds Étape 3
        {
          selector: 'node.step-child-node.step-3',
          style: {
            'background-color': themeColors.step3Bg,
            'border-color': themeColors.step3Border,
            color: themeColors.step3Text,
          },
        },

        // Survol des étapes
        {
          selector: 'node.step-child-node:hover',
          style: {
            'border-width': 2.5,
          },
        },

        // Style des Flèches du Flux
        {
          selector: 'edge',
          style: {
            width: 2.5,
            'line-color': themeColors.edgeColor,
            'target-arrow-color': themeColors.edgeColor,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
          },
        },
      ],
      layout: { name: 'preset' },
      userZoomingEnabled: false,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;
    cy.fit(undefined, 45);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, themeColors]);

  // Interaction Molette : Pan de base, Zoom avec Cmd/Ctrl
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!cyRef.current) return;
      e.preventDefault();
      const cy = cyRef.current;

      if (e.metaKey || e.ctrlKey) {
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const rect = container.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        cy.zoom({
          level: cy.zoom() * zoomFactor,
          renderedPosition: position,
        });
      } else {
        cy.panBy({
          x: -e.deltaX,
          y: -e.deltaY,
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleFitView = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 45);
      cyRef.current.center();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() * 1.2,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() * 0.8,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  }, []);

  // Barre d'outils
  const topContent = (
    <div className="flex justify-between items-center bg-muted/30 p-1.5 border-border border-b font-mono text-xs select-none shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm h-6">
          <Layers size={12} className="text-muted-foreground" />
          <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Orientation:</span>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'TB' | 'LR')}
            className="bg-transparent p-0 border-0 focus:ring-0 h-5 font-mono font-bold text-foreground text-xs cursor-pointer"
          >
            <option value="TB">Vertical (TB)</option>
            <option value="LR">Horizontal (LR)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          id="btn-graph-zoom-in"
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={handleZoomIn}
          data-tooltip="Zoom In (Cmd + Scroll)"
        >
          <Plus size={12} />
        </Button>

        <Button
          id="btn-graph-zoom-out"
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={handleZoomOut}
          data-tooltip="Zoom Out (Cmd + Scroll)"
        >
          <Minus size={12} />
        </Button>

        <ToolbarSeparator />

        <Button
          id="btn-graph-fit-view"
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={handleFitView}
          data-tooltip="Fit View to Canvas"
        >
          <Focus size={12} />
        </Button>
      </div>
    </div>
  );

  const middleContent = (
    <div className="relative bg-card w-full h-full min-h-0 overflow-hidden">
      <div ref={containerRef} className="w-full h-full min-h-[320px]" />
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-graph-design"
      topId="panel-graph-design-top"
      middleId="panel-graph-design-middle"
      className="bg-card w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default GraphDesignTab;
