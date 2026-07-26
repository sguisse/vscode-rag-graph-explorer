export interface GraphNode {
    id: string;
    label: string;
    group: 'file' | 'class' | 'method' | 'document' | string;
    source_file?: string;
    source_location?: string;
}

export interface GraphEdge {
    from: string;
    to: string;
    type: string;
}

export interface ExtensionConfig {
    entitiesTypesList: string[];
    regexFilterEnabled: boolean;
    treeFilterEnabled: boolean;
    geminiApiKey: string;
}
