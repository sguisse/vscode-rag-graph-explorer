import React from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';

export function ConfigurationPanel() {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { config, updateConfig } = useGraphRagExplorerStore();

  const handleSaveConfig = () => {
    setNotification(`✅ Configuration saved to local backend JSON: ${config.backendConfigPath}`);
  };

  return (
    <div className="space-y-3 font-mono text-xs animate-in duration-200 fade-in">
      {/* Header Title */}
      <div className="bg-muted/30 p-3 border border-border rounded-lg space-y-1">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-primary" />
          <h4 className="font-bold text-foreground text-xs uppercase">Explorer Global Settings</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Persistent workspace settings stored in <code className="text-primary">{config.backendConfigPath}</code>
        </p>
      </div>

      {/* Form Settings */}
      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">
            Backend JSON Config File Path :
          </label>
          <Input
            value={config.backendConfigPath}
            onChange={(e) => updateConfig({ backendConfigPath: e.target.value })}
            className="bg-background h-8 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Default Client Provider :</label>
            <Input
              value={config.defaultClient}
              onChange={(e) => updateConfig({ defaultClient: e.target.value })}
              className="bg-background h-8 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Default Model Name :</label>
            <Input
              value={config.defaultModel}
              onChange={(e) => updateConfig({ defaultModel: e.target.value })}
              className="bg-background h-8 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Max Tokens Limit :</label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: Number(e.target.value) || 4096 })}
              className="bg-background h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Temperature :</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: Number(e.target.value) || 0.2 })}
              className="bg-background h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">System Prompt Prefix :</label>
          <Textarea
            value={config.systemPromptPrefix}
            onChange={(e) => updateConfig({ systemPromptPrefix: e.target.value })}
            className="bg-background h-16 text-xs resize-none font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] font-bold text-foreground">Save History Locally</span>
          <Switch
            checked={config.saveHistoryLocally}
            onCheckedChange={(checked) => updateConfig({ saveHistoryLocally: checked })}
          />
        </div>
      </div>

      {/* JSON Mock Preview */}
      <div className="space-y-1.5 bg-card p-3 border border-border rounded-lg">
        <span className="block font-bold text-[10px] text-muted-foreground uppercase">
          JSON Config Payload Mock Preview
        </span>
        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 font-mono text-[10px] max-h-36 overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Save Action */}
      <Button
        onClick={handleSaveConfig}
        className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer shadow-sm"
      >
        <Save size={14} /> Save Configuration (.token-razor/config/)
      </Button>
    </div>
  );
}
