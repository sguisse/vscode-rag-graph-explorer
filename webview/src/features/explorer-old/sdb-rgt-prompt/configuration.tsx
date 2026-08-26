import React from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useConfiguration } from './hooks/use-configuration';

export function ConfigurationPanel() {
  const { config, updateConfig, handleSaveConfig } = useConfiguration();

  return (
    <div className="space-y-3 font-mono text-xs animate-in duration-200 fade-in">
      {/* Header Title */}
      <div className="space-y-1 bg-muted/30 p-3 border border-border rounded-lg">
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
          <label className="block font-bold text-[10px] text-muted-foreground uppercase">
            Backend JSON Config File Path :
          </label>
          <Input
            value={config.backendConfigPath}
            onChange={(e) => updateConfig({ backendConfigPath: e.target.value })}
            className="bg-background h-8 font-mono text-xs"
          />
        </div>

        <div className="gap-2 grid grid-cols-2">
          <div className="space-y-1">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Default Client Provider :</label>
            <Input
              value={config.defaultClient}
              onChange={(e) => updateConfig({ defaultClient: e.target.value })}
              className="bg-background h-8 font-semibold text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Default Model Name :</label>
            <Input
              value={config.defaultModel}
              onChange={(e) => updateConfig({ defaultModel: e.target.value })}
              className="bg-background h-8 font-semibold text-xs"
            />
          </div>
        </div>

        <div className="gap-2 grid grid-cols-2">
          <div className="space-y-1">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Max Tokens Limit :</label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: Number(e.target.value) || 4096 })}
              className="bg-background h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-[10px] text-muted-foreground uppercase">Temperature :</label>
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
          <label className="block font-bold text-[10px] text-muted-foreground uppercase">System Prompt Prefix :</label>
          <Textarea
            value={config.systemPromptPrefix}
            onChange={(e) => updateConfig({ systemPromptPrefix: e.target.value })}
            className="bg-background h-16 font-mono text-xs resize-none"
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-border border-t">
          <span className="font-bold text-[11px] text-foreground">Save History Locally</span>
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
        <pre className="bg-slate-950 p-2.5 border border-slate-800 rounded max-h-36 overflow-auto font-mono text-[10px] text-slate-300">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Save Action */}
      <Button
        onClick={handleSaveConfig}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm w-full h-9 font-bold text-white cursor-pointer"
      >
        <Save size={14} /> Save Configuration (.token-razor/config/)
      </Button>
    </div>
  );
}
