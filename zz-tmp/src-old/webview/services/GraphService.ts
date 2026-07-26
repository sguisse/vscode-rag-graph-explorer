import { GraphNode, GraphEdge } from '../types';

export class GraphService {
  static loadGraphDataFromFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(new Error('Invalid graph data format file.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsText(file);
    });
  }

  static buildGraph(data: { nodes: any[]; edges: any[] }): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const rawNodes = data.nodes || [];
    const rawEdges = data.edges || [];

    // Filter to isolate only structural Class and Type concepts
    const parsedNodes: GraphNode[] = rawNodes
      .map(n => {
        const coreData = n.data ? n.data : n;
        const id = String(coreData.id);
        const label = coreData.label || coreData.name || id || '';

        let group = String(coreData.type || 'class').toLowerCase();
        if (label.includes('()')) group = 'method';
        else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css|java)$/i)) group = 'file';

        return {
          id,
          label,
          group,
          source_file: coreData.source_file || coreData.path,
          source_location: coreData.source_location
        };
      })
      .filter(n => n.group === 'class');

    const classIds = new Set(parsedNodes.map(n => n.id));

    // Keep only relationship lines where both source and target correspond to active class nodes
    const parsedEdges: GraphEdge[] = rawEdges
      .map(e => {
        const coreData = e.data ? e.data : e;
        return {
          from: String(coreData.source),
          to: String(coreData.target),
          type: coreData.relation || coreData.type || 'relation'
        };
      })
      .filter(e => classIds.has(e.from) && classIds.has(e.to));

    return { nodes: parsedNodes, edges: parsedEdges };
  }
}
