import React, { useMemo } from 'react';
import { GitFork, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';

interface FilesContextPanelProps {
  initialCodebase: CodebaseData;
  selectedEntity: SelectedEntity | null;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function FilesContextPanel({
  initialCodebase,
  selectedEntity,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: FilesContextPanelProps) {

  const combinedFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .map((file: CodebaseFile) => {
        const isImpacted = impactedSet.has(file.id);
        const isSelected = selectedEntity?.nodeId === file.id;
        const statusTag = isSelected ? '[SELECTED]' : isImpacted ? '[IMPACTED]' : '[AVAILABLE]';

        let content = `// ==========================================\n`;
        content += `// File: ${file.path} ${statusTag}\n`;
        content += `// Language: ${file.language} | Size: ${file.size} LOC | Complexity: V(g)=${file.complexity}\n`;
        content += `// ==========================================\n\n`;

        if (file.attributes && file.attributes.length > 0) {
          content += `// Attributes:\n`;
          file.attributes.forEach((attr) => {
            content += `//   ${attr.visibility} ${attr.name}\n`;
          });
          content += `\n`;
        }

        if (file.methods && file.methods.length > 0) {
          content += `// Methods:\n`;
          file.methods.forEach((m) => {
            content += `//   + ${m.name}: ${m.description}\n`;
          });
          content += `\n`;
        }

        if (file.configProperties && file.configProperties.length > 0) {
          content += `// Configuration Properties:\n`;
          file.configProperties.forEach((prop) => {
            content += `${prop.key}=${prop.value}\n`;
          });
          content += `\n`;
        }

        return content;
      })
      .join('\n');
  }, [initialCodebase, impactedSet, selectedEntity]);

  const copyContext = () => {
    handleCopy(combinedFilesContext, "Full Files Context copied to clipboard!");
  };

  return (
    <div className="space-y-4 animate-in duration-200 fade-in font-mono text-xs">
      {/* Moved Impact Direction Controls */}
      <div className="space-y-2 bg-muted/30 p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button
            onClick={() => setEnableDownstream(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableDownstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} className="rotate-180" />
            Downstream
          </Button>
          <Button
            onClick={() => setEnableUpstream(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableUpstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} />
            Upstream
          </Button>
        </div>
      </div>

      {/* Unified Files Context Preview & Meta */}
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Unified Files Context
            </h4>
          </div>
          <Button
            size="sm"
            onClick={copyContext}
            className="flex items-center gap-1.5 h-7 font-mono text-[11px]"
          >
            <Copy size={12} /> Copy Context
          </Button>
        </div>

        <div className="gap-2 grid grid-cols-3 text-center">
          <div className="bg-muted/40 p-2 border border-border/50 rounded">
            <span className="block text-[10px] text-muted-foreground uppercase">Total Files</span>
            <span className="font-bold text-foreground text-xs">{initialCodebase?.files?.length || 0}</span>
          </div>
          <div className="bg-orange-500/10 p-2 border border-orange-500/20 rounded">
            <span className="block text-[10px] text-orange-500 uppercase">Impacted Files</span>
            <span className="font-bold text-orange-500 text-xs">{impactedSet.size}</span>
          </div>
          <div className="bg-muted/40 p-2 border border-border/50 rounded">
            <span className="block text-[10px] text-muted-foreground uppercase">Context Size</span>
            <span className="font-bold text-foreground text-xs">{(combinedFilesContext.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase">
            <span>Context Preview</span>
            <span>All-In-One Unified File</span>
          </div>
          <pre className="bg-slate-950 p-3 border border-slate-800 rounded-md max-h-64 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto overflow-y-auto whitespace-pre-wrap">
            {combinedFilesContext}
          </pre>
        </div>
      </div>
    </div>
  );
}
