import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GlobalConfigFeature } from '../sub-features/GlobalConfigFeature';
import { CodebaseParsersConfigFeature } from '../sub-features/CodebaseParsersConfigFeature';
import { PoliciesConfigFeature } from '../sub-features/PoliciesConfigFeature';

export function ConfigurationPanel() {
  const [activeTab, setActiveTab] = useState<'global' | 'parsers' | 'policies'>('global');

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-hidden font-mono text-xs">
      <div className="flex bg-muted/40 border-border border-b h-9 shrink-0">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('global')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            activeTab === 'global' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Global Settings
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('parsers')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            activeTab === 'parsers' ? 'border-b-indigo-500 text-indigo-500 bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Parsers (jQA)
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('policies')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            activeTab === 'policies' ? 'border-b-amber-500 text-amber-500 bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Policies & Security
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'global' && <GlobalConfigFeature />}
        {activeTab === 'parsers' && <CodebaseParsersConfigFeature />}
        {activeTab === 'policies' && <PoliciesConfigFeature />}
      </div>
    </div>
  );
}

export default ConfigurationPanel;
