export function getCytoscapeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        'shape': 'round-rectangle',
        'width': 'data(width)',
        'height': 'data(height)',
        'background-color': 'transparent',
        'border-width': 0,
        'label': '',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2.5,
        'line-color': 'rgba(99, 102, 241, 0.6)',
        'target-arrow-color': 'rgba(99, 102, 241, 0.8)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '9px',
        'font-family': 'monospace',
        'color': '#94a3b8',
        'text-background-color': 'var(--card, #0f172a)',
        'text-background-opacity': 1,
        'text-background-padding': '3px',
        'text-border-color': 'var(--border, #334155)',
        'text-border-width': 1,
        'text-border-opacity': 1,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#10b981',
        'target-arrow-color': '#10b981',
        'width': 3.5,
      },
    },
    {
      selector: '.running',
      style: {
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
        'transition-property': 'line-color',
        'transition-duration': '0.3s',
      },
    },
  ];
}
