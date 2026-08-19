import cytoscape from 'cytoscape';

export function getWorkflowCytoscapeStyles(isDarkMode: boolean): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'font-family': 'monospace, sans-serif',
        'font-size': '10px',
        'font-weight': 'bold',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '80px',
        'color': isDarkMode ? '#f8fafc' : '#0f172a',
        'overlay-opacity': 0,
        'transition-property': 'background-color, border-color, border-width',
        'transition-duration': 0.15,
      },
    },
    // Standard Step Node
    {
      selector: 'node.step, node[type = "step"]',
      style: {
        'shape': 'roundrectangle',
        'width': '95px',
        'height': '40px',
        'background-color': isDarkMode ? '#1e3a8a' : '#dbeafe',
        'border-width': '2px',
        'border-color': isDarkMode ? '#3b82f6' : '#2563eb',
        'color': isDarkMode ? '#eff6ff' : '#1e3a8a',
      },
    },
    // Decision Node (Diamond)
    {
      selector: 'node.decision, node[type = "decision"]',
      style: {
        'shape': 'diamond',
        'width': '72px',
        'height': '72px',
        'background-color': '#ffffff',
        'border-width': '2.5px',
        'border-color': isDarkMode ? '#818cf8' : '#6366f1',
        'color': '#312e81',
        'font-size': '9px',
        'text-max-width': '55px',
      },
    },
    // BPMN Start Event
    {
      selector: 'node.start, node[type = "start"]',
      style: {
        'shape': 'ellipse',
        'width': '32px',
        'height': '32px',
        'background-color': '#ffffff',
        'border-width': '2.5px',
        'border-color': isDarkMode ? '#cbd5e1' : '#334155',
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'color': isDarkMode ? '#cbd5e1' : '#334155',
        'font-size': '9px',
        'text-max-width': '120px',
      },
    },
    // BPMN End Event
    {
      selector: 'node.end, node[type = "end"]',
      style: {
        'shape': 'ellipse',
        'width': '32px',
        'height': '32px',
        'background-color': isDarkMode ? '#451a1a' : '#fef2f2',
        'border-width': '4px',
        'border-color': isDarkMode ? '#f87171' : '#dc2626',
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'color': isDarkMode ? '#fca5a5' : '#b91c1c',
        'font-size': '9px',
        'text-max-width': '100px',
      },
    },
    // Completed Status Highlight
    {
      selector: 'node[status = "completed"], node.completed',
      style: {
        'background-color': isDarkMode ? '#064e3b' : '#d1fae5',
        'border-color': '#10b981',
        'border-width': '3.5px',
        'color': isDarkMode ? '#a7f3d0' : '#065f46',
      },
    },
    // Current Step Highlight
    {
      selector: 'node[?isCurrent], node.current',
      style: {
        'border-color': '#fbbf24',
        'border-width': '3px',
      },
    },
    // Hover State for Clickable Nodes
    {
      selector: 'node.hovered[!isCurrent]',
      style: {
        'border-color': '#2563eb',
        'border-width': '3.5px',
        'background-color': isDarkMode ? '#2563eb' : '#bfdbfe',
        'color': isDarkMode ? '#ffffff' : '#1e3a8a',
      },
    },
    // Selected Node Highlight
    {
      selector: 'node:selected',
      style: {
        'border-color': '#3b82f6',
        'border-width': '3.5px',
      },
    },
    // Dynamic Styled Edges
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': 'data(color)' as any,
        'line-style': 'data(lineStyle)' as any,
        'target-arrow-color': 'data(color)' as any,
        'target-arrow-shape': 'data(arrowShape)' as any,
        'curve-style': 'data(curveStyle)' as any,
        'label': 'data(label)',
        'font-size': '8px',
        'font-family': 'monospace, sans-serif',
        'color': 'data(textColor)' as any,
        'text-wrap': 'wrap',
        'text-max-width': '80px',
        'text-background-opacity': 1,
        'text-background-color': isDarkMode ? '#0f172a' : '#ffffff',
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
      },
    },
  ];
}
