import React from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useGlobalConfigStore } from '../../../core/store/useGlobalConfigStore';
import { useAppContextStore } from '@/store/useAppContextStore';

export function GlobalConfigFeature() {
  const { globalConfig, updateGlobalConfig } = useGlobalConfigStore();
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleSave = () => {
    setNotification('✅ Global Configuration Saved');
  };

  return (
    <div className="space-y-4 p-4 font-mono text-xs animate-in fade-in h-full overflow-y-auto">
      <div className="space-y-1 bg-muted/30 p-3 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-primary" />
          <h4 className="font-bold text-foreground text-xs uppercase">Global App Settings</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">Persistent workspace settings stored in {globalConfig.backendConfigPath}</p>
      </div>

      <div className="space-y-3 bg-card p-4 border border-border rounded-lg shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Default Client Provider:</label>
            <Input value={globalConfig.defaultClient} onChange={e => updateGlobalConfig({ defaultClient: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Default Model:</label>
            <Input value={globalConfig.defaultModel} onChange={e => updateGlobalConfig({ defaultModel: e.target.value })} className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Max Tokens:</label>
            <Input type="number" value={globalConfig.maxTokens} onChange={e => updateGlobalConfig({ maxTokens: Number(e.target.value) })} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Temperature:</label>
            <Input type="number" step="0.1" value={globalConfig.temperature} onChange={e => updateGlobalConfig({ temperature: Number(e.target.value) })} className="h-8" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-[10px] text-muted-foreground uppercase">System Prompt Prefix:</label>
          <Textarea value={globalConfig.systemPromptPrefix} onChange={e => updateGlobalConfig({ systemPromptPrefix: e.target.value })} className="h-20 resize-none" />
        </div>

        <div className="flex justify-between items-center pt-3 border-border border-t">
          <span className="font-bold text-[11px] text-foreground">Save History Locally</span>
          <Switch checked={globalConfig.saveHistoryLocally} onCheckedChange={(c) => updateGlobalConfig({ saveHistoryLocally: c })} />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full gap-2 font-bold cursor-pointer">
        <Save size={14} /> Save Configuration
      </Button>
    </div>
  );
}
