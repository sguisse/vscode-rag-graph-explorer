import React from 'react';
import { GraphNode, GraphEdge } from '../types';
import { ExplorerTabContainer } from './explorer-tab/ExplorerTabContainer';

interface ExplorerTabProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
    config?: any;
}

export const ExplorerTab: React.FC<ExplorerTabProps> = (props) => {
    return <ExplorerTabContainer {...props} />;
};
