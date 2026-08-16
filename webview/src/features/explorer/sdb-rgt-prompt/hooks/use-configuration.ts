import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../store/useExplorerStore';

export function useConfiguration() {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const config = useExplorerStore((s) => s.config);
  const updateConfig = useExplorerStore((s) => s.updateConfig);

  const handleSaveConfig = () => {
    setNotification(`✅ Configuration saved to local backend JSON: ${config.backendConfigPath}`);
  };

  return {
    config,
    updateConfig,
    handleSaveConfig,
  };
}
