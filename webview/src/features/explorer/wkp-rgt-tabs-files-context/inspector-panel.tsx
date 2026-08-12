import React, { useMemo } from 'react';
import {
  FileCode,
  ShieldAlert,
  Fingerprint,
  Tag,
  Code2,
  Layers,
  Hash,
  Settings,
  ListTree,
  Braces,
  Puzzle,
  Boxes,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';

interface InspectorPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream?: boolean;
  setEnableDownstream?: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream?: boolean;
  setEnableUpstream?: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet?: Set<string>;
  handleCopy?: (text: string, message: string) => void;
}

const VISIBILITY_ORDER = ['public', 'protected', 'package', 'private'];

export function InspectorPanel({
  selectedEntity,
  initialCodebase,
}: InspectorPanelProps) {

  if (!selectedEntity) {
    return (
      <div className="py-8 text-muted-foreground text-center">
        <ShieldAlert size={32} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">
          Click any graph node, member handle, or tree item to inspect structural properties.
        </p>
      </div>
    );
  }

  const currentFile = initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId);
  if (!currentFile) return null;

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Puzzle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'module': return <Boxes className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'interface': return <Braces className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'class': return <Box className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'config': return <Settings className="w-4 h-4 text-amber-400 shrink-0" />;
      default: return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const selectedMethod = selectedEntity.type === 'member'
    ? currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId)
    : null;

  const selectedProp = selectedEntity.type === 'member'
    ? currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId)
    : null;

  // Group attributes by visibility (public, protected, package, private)
  const groupedAttributes = useMemo(() => {
    if (!currentFile.attributes || currentFile.attributes.length === 0) return {};
    const groups: Record<string, CodebaseAttribute[]> = {};
    currentFile.attributes.forEach((attr) => {
      const vis = attr.visibility || 'public';
      if (!groups[vis]) groups[vis] = [];
      groups[vis].push(attr);
    });
    return groups;
  }, [currentFile.attributes]);

  const sortedVisibilities = useMemo(() => {
    const keys = Object.keys(groupedAttributes);
    return keys.sort((a, b) => {
      const idxA = VISIBILITY_ORDER.indexOf(a);
      const idxB = VISIBILITY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedAttributes]);

  return (
    <div className="space-y-2.5 font-mono text-xs animate-in duration-200 fade-in">
      {/* Active Subsystem Header */}
      <div className="space-y-2 bg-primary/5 p-3 border border-primary/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-[10px] text-primary uppercase tracking-wider">
            ACTIVE SUBSYSTEM
          </span>
          <span className="bg-primary/10 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-primary">
            {currentFile.language}
          </span>
        </div>
        <div className="flex items-start gap-2 mt-2">
          {renderTypeIcon(currentFile.type)}
          <div className="overflow-hidden">
            <h4 className="font-mono font-bold text-foreground text-xs truncate">
              {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}` : currentFile.name}
            </h4>
            <span className="block mt-0.5 font-mono text-[10px] text-muted-foreground truncate">
              {currentFile.path}
            </span>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-2 pt-2 border-border border-t">
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Volume of Code</span>
            <span className="font-mono font-bold text-[11px] text-foreground">{currentFile.size || 0} LOC</span>
          </div>
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Complexity V(g)</span>
            <span className="font-mono font-bold text-[11px] text-foreground">Level {currentFile.complexity || 1}</span>
          </div>
        </div>

        {/* Resizable and Scrollable Functional Documentation Box */}
        <div className="bg-slate-950 mt-2 p-2 border border-slate-800 rounded min-h-[60px] max-h-[250px] overflow-auto font-mono text-slate-300 text-xs resize-y">
          <div className="top-0 sticky bg-slate-950/90 backdrop-blur-xs mb-1 py-0.5 font-bold text-[9px] text-amber-400 uppercase select-none">
            Functional Documentation:
          </div>
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
            {selectedMethod?.description || selectedProp?.value || (
              `File container (${currentFile.type}) encapsulating polyglot AST architecture layers at ${currentFile.path}.`
            )}
          </div>
        </div>
      </div>

      {/* Identity Attributes */}
      <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
        <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-primary shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Identity Attributes
              </CardTitle>
            </div>
            <span className="bg-primary/10 px-1.5 py-0.5 rounded-full font-mono font-semibold text-[9px] text-primary uppercase">
              {selectedEntity.type}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-1.5 p-2 font-mono text-[11px]">
          <div className="space-y-1 bg-muted/30 p-1.5 border border-border/40 rounded-md">
            <div className="flex items-center gap-1 font-semibold text-[9px] text-muted-foreground uppercase">
              <Hash className="w-3 h-3 text-primary" /> FQN Identifier
            </div>
            <div className="bg-background/80 p-1 border border-border/30 rounded font-medium text-[11px] text-foreground break-all">
              {selectedEntity.nodeId}
            </div>
          </div>

          <div className="gap-1.5 grid grid-cols-2">
            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Tag className="w-3 h-3 text-amber-500" /> Entity Type
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground uppercase">
                {currentFile.type}
              </span>
            </div>

            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Layers className="w-3 h-3 text-indigo-500" /> Target Member
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground truncate">
                {selectedEntity.memberId ? `${selectedEntity.memberId}` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedEntity.edgeId && (
            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Code2 className="w-3 h-3 text-emerald-500" /> Edge ID
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground break-all">
                {selectedEntity.edgeId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type-Specific Structural Details */}
      {currentFile.type === 'config' ? (
        <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
          <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Config Properties ({currentFile.configProperties?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {(!currentFile.configProperties || currentFile.configProperties.length === 0) ? (
              <span className="text-muted-foreground text-xs italic">No properties mapped</span>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentFile.configProperties.map((prop: ConfigProperty, idx: number) => {
                  const isSelected = selectedEntity.memberId === prop.key;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded border font-mono text-[11px] ${
                        isSelected ? 'border-amber-500 bg-amber-500/10 font-bold' : 'border-border/40 bg-muted/20'
                      }`}
                    >
                      <span className="block font-semibold text-amber-500">{prop.key}</span>
                      <span className="block text-muted-foreground truncate">{prop.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Grouped Attributes Section */}
          <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
            <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
              <div className="flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-primary shrink-0" />
                <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                  Attributes / Fields ({currentFile.attributes?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {sortedVisibilities.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">No attributes declared</span>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {sortedVisibilities.map((vis) => (
                    <div key={vis} className="space-y-0.5">
                      <div className="px-0.5 font-bold text-[9px] text-muted-foreground uppercase tracking-wider">
                        {vis}
                      </div>
                      <div className="space-y-0.5">
                        {groupedAttributes[vis].map((attr: CodebaseAttribute, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-muted/20 px-1.5 py-0.5 border border-border/30 rounded text-[11px]"
                          >
                            <span className="bg-primary/10 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                              {attr.visibility}
                            </span>
                            <span className="font-semibold text-foreground truncate">{attr.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Methods Section with Tooltip on Signature/Name */}
          <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
            <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                  Methods / Exports ({currentFile.methods?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {(!currentFile.methods || currentFile.methods.length === 0) ? (
                <span className="text-muted-foreground text-xs italic">No methods declared</span>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {currentFile.methods.map((m: CodebaseMethod) => {
                    const isSelected = selectedEntity.memberId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`p-1 rounded border text-[11px] ${
                          isSelected ? 'border-indigo-500 bg-indigo-500/10 font-bold' : 'border-border/30 bg-muted/20'
                        }`}
                      >
                        <span
                          className="block font-semibold text-foreground truncate cursor-help"
                          data-tooltip={m.signature || ''}
                        >
                          + {m.name}
                        </span>
                        {m.description && (
                          <span className="block mt-0.5 text-[10px] text-muted-foreground leading-snug">
                            {m.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
