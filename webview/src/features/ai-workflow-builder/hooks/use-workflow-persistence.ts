import { useEffect } from 'react';
import { useWorkflowStore } from './use-workflow-store';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

const STORAGE_KEY = 'ai_workflow_builder_schema_v1';

export function useWorkflowPersistence() {
  const { nodes, edges, loadWorkflow } = useWorkflowStore();

  // Load state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) && parsed.nodes.length > 0) {
          loadWorkflow(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load persisted workflow state:', err);
    }
  }, [loadWorkflow]);

  // Auto-save state on node/edge updates
  useEffect(() => {
    try {
      const schema = JSON.stringify({ nodes, edges });
      localStorage.setItem(STORAGE_KEY, schema);
      if (typeof (vsCodeApiService as any).postMessage === 'function') {
        (vsCodeApiService as any).postMessage({ type: 'persistWorkflowState', payload: schema });
      }
    } catch (err) {
      console.warn('Failed to persist workflow state:', err);
    }
  }, [nodes, edges]);
}
