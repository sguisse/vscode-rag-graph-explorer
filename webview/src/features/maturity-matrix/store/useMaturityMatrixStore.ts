import { create } from 'zustand';
import { MaturityMatrixTabId, MaturityCategory } from '../types/maturity-matrix.types';

interface MaturityMatrixStoreState {
  activeTab: MaturityMatrixTabId;
  setActiveTab: (tab: MaturityMatrixTabId) => void;
  categories: MaturityCategory[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}

const DEFAULT_CATEGORIES: MaturityCategory[] = [
  {
    id: 'arch',
    name: 'Architecture & Invariants',
    icon: 'Layers',
    currentLevel: 3,
    targetLevel: 4,
    description: 'Enforcement of architectural guardrails, tri-layer isolation, and secret storage.',
    capabilities: [
      'Parameterized Shell Executions',
      'Process Group Zombie Cleanup',
      'SecretStorage Credential Isolation',
      'Immutable Code Gen Assertions',
    ],
  },
  {
    id: 'frontend',
    name: 'React 19 Webview Engineering',
    icon: 'Layout',
    currentLevel: 4,
    targetLevel: 4,
    description: 'Declarative component hierarchy using shadcn/ui and Zustand state management.',
    capabilities: [
      'Pure View & Handler Separation',
      'CollapsibleCard Summary Badges',
      'Rich HTML Tooltips via data-tooltip',
      'Tab Navigation System',
    ],
  },
  {
    id: 'graphrag',
    name: 'GraphRAG & Neo4j Pipelines',
    icon: 'Network',
    currentLevel: 2,
    targetLevel: 4,
    description: 'AST dependency parsing, jQAssistant normalization, and Cypher graph querying.',
    capabilities: [
      'Transitive Impact Radius Calculation',
      'Cypher BFS Traversal',
      'Embedded Neo4j Server Lifecycle',
      'Vector Semantic Embeddings',
    ],
  },
];

export const useMaturityMatrixStore = create<MaturityMatrixStoreState>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  categories: DEFAULT_CATEGORIES,
  selectedCategoryId: 'arch',
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
