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
          reject(new Error('Invalid graph.json file.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsText(file);
    });
  }

  static buildGraph(data: { nodes: any[]; links: any[] }): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const parsedNodes: GraphNode[] = (data.nodes || []).map(n => {
      let group = 'class';
      const label = n.label || n.id || '';
      if (label.includes('()')) group = 'method';
      else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css)$/i)) group = 'file';
      if (n.file_type === 'document' || n.file_type === 'rationale') group = 'document';
      return { id: String(n.id), label, group, source_file: n.source_file, source_location: n.source_location };
    });

    const parsedEdges: GraphEdge[] = (data.links || []).map(l => ({
      from: String(l.source),
      to: String(l.target),
      type: l.relation || 'relation'
    }));

    return { nodes: parsedNodes, edges: parsedEdges };
  }
}
