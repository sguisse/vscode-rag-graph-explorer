import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';

export function useConfiguration() {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { config, updateConfig } = useGraphRagExplorerStore();

  const handleSaveConfig = () => {
    setNotification(`✅ Configuration saved to local backend JSON: ${config.backendConfigPath}`);
  };

  return {
    config,
    updateConfig,
    handleSaveConfig,
  };
}
