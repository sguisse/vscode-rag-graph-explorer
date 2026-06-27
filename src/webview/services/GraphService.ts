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
    // Zero computation mapping block! Data is already tailored perfectly by Python.
    const parsedNodes: GraphNode[] = (data.nodes || []).map(n => {
      let group = 'class';
      const label = n.label || n.id || '';
      if (label.includes('()')) group = 'method';
      else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css)$/i)) group = 'file';
      if (n.file_type === 'document' || n.file_type === 'rationale') group = 'document';
      return { id: String(n.id), label, group, source_file: n.source_file, source_location: n.source_location };
    });

    const parsedEdges: GraphEdge[] = (data.edges || []).map(e => ({
      from: String(e.from),
      to: String(e.to),
      type: e.relation || 'relation'
    }));

    return { nodes: parsedNodes, edges: parsedEdges };
  }
}
