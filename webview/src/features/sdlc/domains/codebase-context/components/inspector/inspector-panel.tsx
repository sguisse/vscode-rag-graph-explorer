import React from 'react';
import {
  FileCode,
  ShieldAlert,
  Tag,
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
import { CollapsibleCard } from '@/components/app/collapsible-card';
import {
  CodebaseData,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
} from '@/shared/services/graph-rag-explorer';
import { useCodebaseDomainState } from '../../store/useCodebaseDomainState';
import { useInspectorPanel } from './hooks/use-inspector-panel';

export interface InspectorPanelProps {
  selectedEntity?: SelectedEntity | null;
  initialCodebase?: CodebaseData;
  enableDownstream?: boolean;
  setEnableDownstream?: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream?: boolean;
  setEnableUpstream?: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet?: Set<string>;
  handleCopy?: (text: string, message: string) => void;
}

const TAG_CATEGORIES: Record<string, string[]> = {
  'Domain & Architecture': [
    'DomainLayer', 'DomainObject', 'Entity', 'PortIn', 'PortOut', 'Service', 'Component', 'backend'
  ],
  'OOP & Structures': [
    'Class', 'Interface', 'Enum', 'Type', 'HasSubType', 'HasSuperType', 'AssociatedElement', 'Java', 'File'
  ],
  'Patterns & Frameworks': [
    'Builder', 'Mapper', 'StrategyPatternContext', 'StrategyPatternInterface', 'NoArgsConstructor', 'Slf4j'
  ],
  'Traceability & Analysis': [
    'AnnotationImpactTraceable', 'HierarchyImpactTraceable', 'DeadCodeCandidate', 'ByteCode', 'Throwable'
  ],
};

const groupTagsByCategory = (tags: string[] = []) => {
  const grouped: Record<string, string[]> = {
    'Domain & Architecture': [],
    'OOP & Structures': [],
    'Patterns & Frameworks': [],
    'Traceability & Analysis': [],
    'Others': [],
  };

  tags.forEach((rawTag) => {
    const cleanTag = rawTag.replace(/\/$/, '').trim();
    let isMatched = false;

    for (const [category, knownTags] of Object.entries(TAG_CATEGORIES)) {
      if (knownTags.some((kt) => kt.toLowerCase() === cleanTag.toLowerCase())) {
        grouped[category].push(cleanTag);
        isMatched = true;
        break;
      }
    }

    if (!isMatched) {
      grouped['Others'].push(cleanTag);
    }
  });

  return grouped;
};

export function InspectorPanel(props: InspectorPanelProps = {}) {
  const storeSelectedEntity = useCodebaseDomainState((s) => s.selectedEntity);
  const storeCodebase = useCodebaseDomainState((s) => s.codebase);

  const selectedEntity = props.selectedEntity ?? storeSelectedEntity;
  const initialCodebase = props.initialCodebase ?? storeCodebase;

  const {
    currentFile,
    groupedAttributes,
    sortedVisibilities,
    handleCopyFileCypherQuery,
    handleCopyMethodCypherQuery,
  } = useInspectorPanel(selectedEntity, initialCodebase, props.handleCopy);

  if (!selectedEntity || !currentFile) {
    return (
      <div className="py-8 font-mono text-muted-foreground text-center">
        <ShieldAlert size={32} className="mx-auto mb-2 text-muted-foreground opacity-40" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-xs text-muted-foreground">
          Click any graph node, member handle, or tree item to inspect structural properties.
        </p>
      </div>
    );
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Puzzle className="shrink-0 w-4 h-4 text-emerald-400" />;
      case 'module': return <Boxes className="shrink-0 w-4 h-4 text-purple-400" />;
      case 'interface': return <Braces className="shrink-0 w-4 h-4 text-indigo-400" />;
      case 'class': return <Box className="shrink-0 w-4 h-4 text-blue-400" />;
      case 'config': return <Settings className="shrink-0 w-4 h-4 text-amber-400" />;
      default: return <FileCode className="shrink-0 w-4 h-4 text-slate-400" />;
    }
  };

  const attributesCopyText = (currentFile.attributes || [])
    .map((a) => `${a.visibility || 'public'} ${a.name}`)
    .join('\n');

  const methodsCopyText = (currentFile.methods || [])
    .map((m) => `${m.visibility || 'public'} ${m.name}`)
    .join('\n');

  const tagsCopyText = (currentFile.tags || []).join('\n');

  const groupedTags = groupTagsByCategory(currentFile.tags);

  return (
    <div className="flex flex-col space-y-1.5 font-mono text-xs duration-200 animate-in fade-in h-full">
      <div className="space-y-1 bg-primary/5 p-2 border border-primary/20 rounded-lg shrink-0">
        <div className="flex items-start gap-2 mt-0">
          {renderTypeIcon(currentFile.type)}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex justify-between items-center gap-2">
              <h4 className="font-mono font-bold text-xs text-foreground truncate">
                {`${currentFile.name}`}
              </h4>

              <span className="bg-primary/10 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-primary shrink-0">
                {currentFile.language}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground mt-0.5 min-w-0">
          <Hash className="shrink-0 w-3 h-3 text-primary" />
          <span className="truncate">{selectedEntity.nodeId}</span>
          <Database
            className="ms-auto shrink-0 w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            onClick={handleCopyFileCypherQuery}
            data-tooltip="Copy Neo4j Cypher query for this file/type"
          />
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground mt-0.5 min-w-0">
          <Folder className="shrink-0 w-3 h-3 text-primary" />
          <span
            className="block text-left truncate w-full"
            style={{ direction: 'rtl', textAlign: 'left' }}
            title={currentFile.path}
          >
            <bdi>{currentFile.path?.replace(/[/\\]+$/, '')}</bdi>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
              <Tag className="w-3 h-3 text-amber-500" /> Entity Type
            </span>
            <span className="block font-bold text-[11px] text-foreground uppercase mt-0.5">
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

        <div className="bg-slate-950 mt-2 p-2 border border-slate-800 rounded min-h-[60px] max-h-[160px] font-mono text-xs text-slate-300 overflow-auto resize-y">
          <div className="top-0 sticky bg-slate-950/90 backdrop-blur-xs mb-1 py-0.5 font-bold text-[9px] text-amber-400 uppercase select-none">
            AI Summary:
          </div>
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
            {currentFile?.description || (
              `Activate AI summary to get semantic insights!`
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 space-y-1.5 overflow-y-auto">
        <CollapsibleCard
          cardId="card-inspector-attributes"
          defaultExpanded={false}
          title={
            <div className="flex items-center gap-1.5">
              <ListTree className="shrink-0 w-3.5 h-3.5 text-primary" />
              <span className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Attributes / Fields ({currentFile.attributes?.length || 0})
              </span>
            </div>
          }
          contentToCopy={attributesCopyText}
          className="bg-card/50 border-border shadow-xs shrink-0 overflow-hidden"
          headerClassName="bg-muted/40 p-1.5 px-2 border-b border-border/60"
        >
          {sortedVisibilities.length === 0 ? (
            <span className="text-[12px] text-xs text-muted-foreground italic">No attributes declared</span>
          ) : (
            <div className="space-y-0 px-0 max-h-36 overflow-y-auto">
              {sortedVisibilities.map((vis) => (
                <div key={vis} className="space-y-0">
                  <div className="space-y-0">
                    {groupedAttributes[vis].map((attr: CodebaseAttribute, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center gap-1.5 bg-muted/20 px-1 py-0.5 border-border/30 rounded text-[11px]"
                      >
                        <div className="flex flex-1 items-center gap-1.5 min-w-0">
                          <span className="bg-primary/10 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                            {attr.visibility}
                          </span>
                          <span className="font-semibold text-foreground truncate">{attr.name}</span>
                        </div>

                        {attr.type && (
                          <div className="flex items-center gap-1 ml-auto font-mono text-[10px] text-muted-foreground shrink-0">
                            <span></span>
                            <span
                              className="max-w-[200px] font-medium text-foreground/90 text-left truncate [direction:rtl]"
                              data-tooltip={attr.type ? attr.type.match(/.{1,15}/g)?.join('\n') : undefined}
                            >
                              <bdi>{attr.type}</bdi>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleCard>

        <CollapsibleCard
          cardId="card-inspector-methods"
          defaultExpanded={true}
          title={
            <div className="flex items-center gap-1.5">
              <SquareFunction className="shrink-0 w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Methods / Exports ({currentFile.methods?.length || 0})
              </span>
            </div>
          }
          contentToCopy={methodsCopyText}
          className="bg-card/50 border-border shadow-xs shrink-0 overflow-hidden"
          headerClassName="bg-muted/40 p-1.5 px-2 border-b border-border/60"
        >
          {(!currentFile.methods || currentFile.methods.length === 0) ? (
            <span className="text-[12px] text-xs text-muted-foreground italic">No methods declared</span>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {currentFile.methods.map((m: CodebaseMethod) => {
                const isSelected = selectedEntity.memberId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`p-1 rounded border text-[11px] ${
                      isSelected ? 'border-indigo-500 bg-indigo-500/10 font-bold' : 'border-border/30 bg-muted/20'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="bg-primary/10 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                          {m.visibility}
                        </span>
                        <span
                          className="font-semibold text-foreground truncate cursor-help min-w-0"
                          data-tooltip={m.signature || ''}
                        >
                          {m.name}
                        </span>
                      </div>
                      <Database
                        className="shrink-0 w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        onClick={(e) => handleCopyMethodCypherQuery(m, e)}
                        data-tooltip={`Copy Neo4j Cypher query for method ${m.name}`}
                      />
                    </div>

                    {m.description && (
                      <span className="block text-[10px] text-muted-foreground leading-snug mt-0.5">
                        {m.description}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleCard>

        <CollapsibleCard
          cardId="card-inspector-tags"
          defaultExpanded={false}
          title={
            <div className="flex items-center gap-1.5">
              <Tag className="shrink-0 w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Codebase Tags ({currentFile.tags?.length || 0})
              </span>
            </div>
          }
          contentToCopy={tagsCopyText}
          className="bg-card/50 border-border shadow-xs shrink-0 overflow-hidden"
          headerClassName="bg-muted/40 p-1.5 px-2 border-b border-border/60"
        >
          {(!currentFile.tags || currentFile.tags.length === 0) ? (
            <span className="text-[12px] text-xs text-muted-foreground italic">No tags assigned</span>
          ) : (
            <div className="space-y-2 p-1 max-h-48 overflow-y-auto">
              {Object.entries(groupedTags).map(([category, tags]) => {
                if (tags.length === 0) return null;
                return (
                  <div key={category} className="space-y-1">
                    <span className="block font-mono font-bold text-[9px] text-muted-foreground uppercase tracking-tight">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono font-semibold text-[10px] text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
