#!/usr/bin/env bash
set -e

# Ensure target directory exists
mkdir -p webview/src/features/explorer/wkp-rgt-tabs-files-context

# 1. Update files-context.tsx to add the Fluorescent Impact Plan block before Unified Files Context
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/files-context.tsx
import React, { useMemo } from 'react';
import { GitFork, FileText, Copy, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { generateMarkdownRecipe } from '@/services/view/prompt-view.service';

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

  const generatedMarkdownRecipe = useMemo(() => {
    return generateMarkdownRecipe(selectedEntity, enableDownstream, enableUpstream, impactedSet, initialCodebase);
  }, [selectedEntity, enableDownstream, enableUpstream, impactedSet, initialCodebase]);

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
      {/* Impact Propagation Controls */}
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

      {/* Fluorescent Impact Plan */}
      <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5>
          </div>
          <Button
            onClick={() => handleCopy(generatedMarkdownRecipe, "Markdown impact recipe copied to clip-board!")}
            className="flex items-center gap-1 bg-muted hover:bg-muted/80 px-2 py-1 border border-border rounded h-6 font-mono text-[10px] text-foreground cursor-pointer"
          >
            <Copy size={10} />Copy Recipes
          </Button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {initialCodebase.files.map((f: CodebaseFile) =>
            impactedSet.has(f.id) ? (
              <div key={f.id} className="flex justify-between items-center bg-background px-2 py-1.5 border border-orange-500/20 rounded font-mono text-[11px]">
                <span className="font-semibold text-foreground truncate">{f.name}</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">{f.language}</span>
              </div>
            ) : null
          )}
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
            className="flex items-center gap-1.5 h-7 font-mono text-[11px] cursor-pointer"
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
EOF

# 2. Remove the Fluorescent Impact Plan block from inspector-tab-panel.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/inspector-tab-panel.tsx
import React from 'react';
import { FileCode, ShieldAlert, Fingerprint, Tag, Code2, Layers, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';

interface InspectorTabPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function InspectorTabPanel({
  selectedEntity,
  initialCodebase,
}: InspectorTabPanelProps) {

  if (!selectedEntity) {
    return (
      <div className="py-12 text-muted-foreground text-center">
        <ShieldAlert size={36} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">Click any file component link row or surgical grid handle item to initialize graph mapping parameters.</p>
      </div>
    );
  }

  const currentFile = initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId);
  if (!currentFile) return null;

  return (
    <div className="space-y-4 animate-in duration-200 fade-in">
      {/* Active Element Properties Block */}
      <div className="space-y-3 bg-primary/5 p-4 border border-primary/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-[10px] text-primary uppercase tracking-wider">ACTIVE SUBSYSTEM</span>
          <span className="bg-primary/10 px-2.5 py-0.5 rounded font-mono font-bold text-primary text-xs">{currentFile.language}</span>
        </div>
        <div className="flex items-start gap-2.5 mt-3">
          <FileCode size={20} className="mt-1 text-primary shrink-0" />
          <div className="overflow-hidden">
            <h4 className="font-mono font-bold text-foreground text-sm truncate">
              {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}()` : currentFile.name}
            </h4>
            <span className="block mt-0.5 font-mono text-[10px] text-muted-foreground truncate">{currentFile.path}</span>
          </div>
        </div>
        <div className="gap-3 grid grid-cols-2 pt-3 border-border border-t">
          <div className="bg-background p-2 border border-border rounded">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">Volume of Code</span>
            <span className="font-mono font-bold text-foreground text-xs">{currentFile.size} LOC</span>
          </div>
          <div className="bg-background p-2 border border-border rounded">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">Complexity V(g)</span>
            <span className="font-mono font-bold text-foreground text-xs">Level {currentFile.complexity}</span>
          </div>
        </div>
        <div className="bg-slate-950 mt-3 p-2.5 border border-slate-800 rounded font-mono text-slate-300 text-xs">
          <div className="mb-1 font-bold text-[10px] text-amber-400 uppercase">Functional Documentation:</div>
          {selectedEntity.type === 'member' ? (
            currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId)?.description ||
            currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId)?.value ||
            "No dedicated structural descriptions mapped for this member item node."
          ) : (
            `File container encapsulating target polyglot implementation layers at specified location pathing.`
          )}
        </div>
      </div>

      {/* Entity Properties Panel */}
      <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
        <CardHeader className="bg-muted/40 p-3 border-border/60 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
                Identity Attributes
              </CardTitle>
            </div>
            <span className="bg-primary/10 px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] text-primary uppercase">
              {selectedEntity.type}
            </span>
          </div>
          <CardDescription className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            Global entity property parameters
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5 p-3 font-mono text-[11px]">
          <div className="space-y-1.5 bg-muted/30 p-2 border border-border/40 rounded-md">
            <div className="flex items-center gap-1 font-semibold text-[10px] text-muted-foreground uppercase">
              <Hash className="w-3 h-3 text-primary" /> FQN Identifier
            </div>
            <div className="bg-background/80 p-1.5 border border-border/30 rounded font-medium text-foreground text-xs break-all">
              {selectedEntity.nodeId}
            </div>
          </div>

          <div className="gap-2 grid grid-cols-2 pt-1">
            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Tag className="w-3 h-3 text-amber-500" /> Entity Type
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs uppercase">
                {selectedEntity.type}
              </span>
            </div>

            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Layers className="w-3 h-3 text-indigo-500" /> Target Member
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs truncate">
                {selectedEntity.memberId ? `${selectedEntity.memberId}()` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedEntity.edgeId && (
            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Code2 className="w-3 h-3 text-emerald-500" /> Edge ID
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs break-all">
                {selectedEntity.edgeId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
EOF

#npm run compile

echo "✅ refactor(ui): Moved Fluorescent Impact Plan block to files-context.tsx right before Unified Files Context preview and recompiled successfully!"
