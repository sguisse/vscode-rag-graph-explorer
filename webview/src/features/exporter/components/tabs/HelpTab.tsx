import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export const HelpTab: React.FC = () => {
  const samplePrompt = `Role: Senior Software Architect
Context: Analyze the provided codebase export attachment.
Task: Identify modular refactoring candidates and security improvements.`;

  const handleCopyPrompt = () => {
    vsCodeApiService.copyToClipboard(samplePrompt);
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs bg-background text-foreground leading-relaxed">
      <div className="p-3 bg-primary/10 border border-primary/20 rounded font-bold text-primary">
        📖 Codebase Exporter Quick User Guide
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-primary text-xs">🚀 Workflows & Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
          <li>Specify multi-line paths in <strong>Source Paths</strong> or use Git Diff auto-discovery.</li>
          <li>Configure regex inclusions & exclusions for files, folders, and extensions.</li>
          <li>Use the <strong>Filters Simulator</strong> to test regex matching in real-time.</li>
          <li>Select output formats (YAML, JSON, XML, TOML, TXT) optimized for LLM contexts.</li>
        </ul>
      </div>

      <div className="space-y-2 p-3 bg-card border border-border rounded">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-foreground text-xs">💡 Sample LLM Prompt Template</h4>
          <Button size="icon-xs" variant="outline" onClick={handleCopyPrompt} title="Copy Prompt">
            <Copy size={12} />
          </Button>
        </div>
        <pre className="p-2 bg-muted text-foreground rounded text-[10px] overflow-x-auto">
          {samplePrompt}
        </pre>
      </div>
    </div>
  );
};
