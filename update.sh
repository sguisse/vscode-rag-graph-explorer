#!/usr/bin/env bash
set -e

echo "🚀 Adding Database icon to each method in InspectorPanel with dedicated Cypher query handler..."

mkdir -p webview/src/features/explorer/wkp-rgt-tabs-files-context/hooks

# 1. Update use-inspector-panel.ts with handleCopyMethodCypherQuery
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/hooks/use-inspector-panel.ts
import { useMemo, useCallback } from 'react';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

const VISIBILITY_ORDER = ['public', 'protected', 'package', 'private'];

export function useInspectorPanel(
  selectedEntity: SelectedEntity | null,
  initialCodebase: CodebaseData,
  handleCopy?: (text: string, message: string) => void
) {
  const currentFile = useMemo(() => {
    if (!selectedEntity) return null;
    return initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId) || null;
  }, [selectedEntity, initialCodebase.files]);

  const selectedMethod = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const selectedProp = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const groupedAttributes = useMemo(() => {
    if (!currentFile?.attributes || currentFile.attributes.length === 0) return {};
    const groups: Record<string, CodebaseAttribute[]> = {};
    currentFile.attributes.forEach((attr) => {
      const vis = attr.visibility || 'public';
      if (!groups[vis]) groups[vis] = [];
      groups[vis].push(attr);
    });
    return groups;
  }, [currentFile]);

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

  const handleCopyCypherQuery = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedEntity) return;

    const nodeId = selectedEntity.nodeId;
    const memberId = selectedEntity.memberId;
    const simpleName = currentFile?.name
      ? currentFile.name.replace(/\.[^/.]+$/, '')
      : (nodeId.split('.').pop() || nodeId);

    let cypherQuery = '';

    if (selectedEntity.type === 'member' && memberId) {
      cypherQuery = `MATCH (t:Type)-[:DECLARES]->(m:Member)
WHERE (t.name = '${simpleName}' OR t.fqn = '${nodeId}' OR t.entity_id = '${nodeId}')
  AND (m.name = '${memberId}' OR m.entity_id = '${memberId}' OR m.signature CONTAINS '${memberId}')
OPTIONAL MATCH (m)-[r:INVOKES]->(callee:Method)
OPTIONAL MATCH (caller:Method)-[inR:INVOKES]->(m)
OPTIONAL MATCH (t)-[:WITH_SOURCE]->(f:File)
RETURN t, m, r, callee, inR, caller, f;`;
    } else {
      cypherQuery = `MATCH (t:Type)
WHERE t.name = '${simpleName}' OR t.fqn = '${nodeId}' OR t.entity_id = '${nodeId}'
OPTIONAL MATCH (t)-[:WITH_SOURCE]->(f:File)
OPTIONAL MATCH (t)-[:DECLARES]->(m:Member)
OPTIONAL MATCH (t)-[r:DEPENDS_ON]->(dep:Type)
RETURN t, f, m, r, dep;`;
    }

    vsCodeApiService.copyToClipboard(cypherQuery);
    if (handleCopy) {
      handleCopy(cypherQuery, `Cypher query for '${simpleName}' copied to clipboard!`);
    } else {
      logInfo(`Cypher query copied to clipboard:\n${cypherQuery}`);
    }
  }, [selectedEntity, currentFile, handleCopy]);

  const handleCopyMethodCypherQuery = useCallback((method: CodebaseMethod, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedEntity) return;

    const nodeId = selectedEntity.nodeId;
    const simpleName = currentFile?.name
      ? currentFile.name.replace(/\.[^/.]+$/, '')
      : (nodeId.split('.').pop() || nodeId);

    const methodCleanName = method.name.replace(/\(\)$/, '').replace(/\(.*\)$/, '');

    const cypherQuery = `MATCH (t:Type)-[:DECLARES]->(m:Member)
WHERE (t.name = '${simpleName}' OR t.fqn = '${nodeId}' OR t.entity_id = '${nodeId}')
  AND (m.name = '${methodCleanName}' OR m.name = '${method.name}' OR m.id = '${method.id}' OR m.entity_id = '${method.id}' OR m.signature CONTAINS '${methodCleanName}')
OPTIONAL MATCH (m)-[r:INVOKES]->(callee:Method)
OPTIONAL MATCH (caller:Method)-[inR:INVOKES]->(m)
OPTIONAL MATCH (t)-[:WITH_SOURCE]->(f:File)
RETURN t, m, r, callee, inR, caller, f;`;

    vsCodeApiService.copyToClipboard(cypherQuery);
    if (handleCopy) {
      handleCopy(cypherQuery, `Cypher query for method '${method.name}' in '${simpleName}' copied to clipboard!`);
    } else {
      logInfo(`Method Cypher query copied to clipboard:\n${cypherQuery}`);
    }
  }, [selectedEntity, currentFile, handleCopy]);

  return {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
    handleCopyCypherQuery,
    handleCopyMethodCypherQuery,
  };
}
EOF

# 2. Update inspector-panel.tsx with Database icon for each method
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/inspector-panel.tsx
import React from 'react';
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
  Box,
  Folder,
  Database,
  SquareFunction
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CodebaseData,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';
import { useInspectorPanel } from './hooks/use-inspector-panel';

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

export function InspectorPanel({
  selectedEntity,
  initialCodebase,
  handleCopy,
}: InspectorPanelProps) {
  const {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
    handleCopyCypherQuery,
    handleCopyMethodCypherQuery,
  } = useInspectorPanel(selectedEntity, initialCodebase, handleCopy);

  if (!selectedEntity || !currentFile) {
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

  return (
    <div className="space-y-1.5 font-mono text-xs animate-in duration-200 fade-in">
      <div className="space-y-1 bg-primary/5 p-2 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-2 mt-0">
          {renderTypeIcon(currentFile.type)}
          <div className="flex-1 w-full min-w-0">
            <div className="flex justify-between items-center gap-2">
              <h4 className="font-mono font-bold text-foreground text-xs truncate">
                {`${currentFile.name}`}
              </h4>

              <span className="bg-primary/10 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-primary shrink-0">
                {currentFile.language}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-0.5 min-w-0 font-mono text-[10px] text-muted-foreground">
          <Hash className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{selectedEntity.nodeId}</span>
          <Database
            className="ms-auto w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
            onClick={handleCopyCypherQuery}
            data-tooltip="Copy Neo4j Cypher query for this file/type"
          />
        </div>

        <div className="flex items-center gap-1 mt-0.5 min-w-0 font-mono text-[10px] text-muted-foreground">
          <Folder className="w-3 h-3 text-primary shrink-0" />
          <span
            className="block w-full text-left truncate"
            style={{ direction: 'rtl', textAlign: 'left' }}
            title={currentFile.path}
          >
            <bdi>{currentFile.path?.replace(/[/\\]+$/, '')}</bdi>
          </span>
        </div>

        <div className="gap-2 grid grid-cols-3 pt-2 border-border border-t">
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
              <Tag className="w-3 h-3 text-amber-500" /> Entity Type
            </span>
            <span className="block mt-0.5 font-bold text-[11px] text-foreground uppercase">
              {currentFile.type}
            </span>
          </div>

          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Volume of Code</span>
            <span className="font-mono font-bold text-[11px] text-foreground">{currentFile.size || 0} LOC</span>
          </div>
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Complexity V(g)</span>
            <span className="font-mono font-bold text-[11px] text-foreground">Level {currentFile.complexity || 1}</span>
          </div>
        </div>

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

      <div className="space-y-2">
        <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
          <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
            <div className="flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-primary shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Attributes / Fields ({currentFile.attributes?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0.5">
            {sortedVisibilities.length === 0 ? (
              <span className="px-2 text-muted-foreground text-xs italic">No attributes declared</span>
            ) : (
              <div className="space-y-0 max-h-36 overflow-y-auto">
                {sortedVisibilities.map((vis) => (
                  <div key={vis} className="space-y-0">
                    <div className="space-y-0">
                      {groupedAttributes[vis].map((attr: CodebaseAttribute, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-muted/20 px-1.5 py-0.5 border-border/30 rounded text-[11px]"
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

        <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
          <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
            <div className="flex items-center gap-1.5">
              <SquareFunction className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Methods / Exports ({currentFile.methods?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-1">
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
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="bg-primary/10 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                            {m.visibility}
                          </span>
                          <span
                            className="min-w-0 font-semibold text-foreground truncate cursor-help"
                            data-tooltip={m.signature || ''}
                          >
                            {m.name}
                          </span>
                        </div>
                        <Database
                          className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                          onClick={(e) => handleCopyMethodCypherQuery(m, e)}
                          data-tooltip={`Copy Neo4j Cypher query for method ${m.name}`}
                        />
                      </div>

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
    </div>
  );
}
EOF

echo "✅ feat: Added Database icon to each method in InspectorPanel with handleCopyMethodCypherQuery handler!"
