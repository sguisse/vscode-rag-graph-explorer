import cytoscape from 'cytoscape';

export const getGraphStyle = (): any[] => [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'width': 26,
            'height': 26,
            'background-color': '#0e639c',
            'border-color': '#1177bb',
            'border-width': 2,
            'color': '#0e639c',
            'font-family': 'var(--vscode-font-family, sans-serif)',
            'font-size': 10,
            'font-weight': '400',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'shape': 'diamond',
            'text-outline-color': 'var(--vscode-editor-background, #1177bb)',
            'text-outline-width': 0,
            'text-max-width': '200px',
            'text-wrap': 'ellipsis',
            'transition-property': 'opacity, border-width, border-color, background-color, transform',
            'transition-duration': 0.25
        }
    },
    {
        selector: 'node[group = "file_unreferenced"]',
        style: {
            'background-color': '#3a1e22',
            'border-color': '#000000',
            'border-width': 2.5,
            'color': '#e0a0a0',
            'shape': 'diamond'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1.5,
            'line-color': '#444444',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#444444',
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'arrow-scale': 0.9,
            'opacity': 0.65,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 0.25
        }
    },
    {
        selector: 'node:selected',
        style: {
            'border-color': '#007acc',
            'border-width': 4,
            'background-color': '#1f8ad2'
        }
    }
];

export const layoutOptions = {
    name: 'cose',
    animate: true,
    refresh: 20,
    fit: true,
    padding: 40,
    nodeOverlap: 40,
    idealEdgeLength: () => 90,
    componentSpacing: 120,
    nodeRepulsion: () => 900000,
    edgeElasticity: () => 100,
    nestingFactor: 5,
    gravity: 25,
    numIter: 1200,
    initialTemp: 300,
    coolingFactor: 0.95,
    minTemp: 1.0
};
