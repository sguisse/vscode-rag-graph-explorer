import cytoscape from 'cytoscape';

export const getGraphStyle = (): any[] => [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'width': 28,
            'height': 28,
            'background-color': '#22c55e',
            'border-color': '#16a34a',
            'border-width': 2,
            'color': '#ffffff',
            'font-family': 'sans-serif',
            'font-size': 10,
            'font-weight': '400',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'shape': 'ellipse',
            'text-max-width': '200px',
            'text-wrap': 'ellipsis',
            'transition-property': 'opacity, border-width, border-color, background-color',
            'transition-duration': 0.25
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1.5,
            'line-color': '#555555',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#555555',
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
    idealEdgeLength: () => 100,
    componentSpacing: 120,
    nodeRepulsion: () => 950000,
    edgeElasticity: () => 100,
    nestingFactor: 5,
    gravity: 25,
    numIter: 1200,
    initialTemp: 300,
    coolingFactor: 0.95,
    minTemp: 1.0
};
