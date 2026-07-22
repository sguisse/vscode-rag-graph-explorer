#!/usr/bin/env bash
set -e

# 1. Create necessary directories
mkdir -p src/services/codebase/domain/model/types
mkdir -p src/components/app

# 2. Create externalized type files following pattern type-xxxx.ts

cat << 'EOF' > src/services/codebase/domain/model/types/type-data-scope.ts
export const DATA_SCOPE_LIST: readonly string[] = ["LOCAL_ONLY", "REMOTE_SYNC"];

export const DATA_SCOPE_ICON_MAP: { [K in (typeof DATA_SCOPE_LIST)[number]]: any } = {
  LOCAL_ONLY: { icon: "🏠", label: "Local Only" },
  REMOTE_SYNC: { icon: "🌐", label: "Remote Sync" },
} as const;

export type DataScope = (typeof DATA_SCOPE_LIST)[number];

export function isDataScope(value: unknown): value is DataScope {
  return typeof value === "string" && DATA_SCOPE_LIST.includes(value);
}

export function getDataScope(value: unknown): DataScope | undefined {
  if (typeof value === "string" && DATA_SCOPE_LIST.includes(value)) {
    return value as DataScope;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-impact-direction.ts
export const IMPACT_DIRECTION_LIST: readonly string[] = ["aval", "amont"];

export const IMPACT_DIRECTION_ICON_MAP: { [K in (typeof IMPACT_DIRECTION_LIST)[number]]: any } = {
  aval: { icon: "⬇️", label: "Downstream" },
  amont: { icon: "⬆️", label: "Upstream" },
} as const;

export type ImpactDirection = (typeof IMPACT_DIRECTION_LIST)[number];

export function isImpactDirection(value: unknown): value is ImpactDirection {
  return typeof value === "string" && IMPACT_DIRECTION_LIST.includes(value);
}

export function getImpactDirection(value: unknown): ImpactDirection | undefined {
  if (typeof value === "string" && IMPACT_DIRECTION_LIST.includes(value)) {
    return value as ImpactDirection;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-file-type.ts
export const FILE_TYPE_LIST: readonly string[] = ["class", "interface", "component", "module", "config"];

export const FILE_TYPE_ICON_MAP: { [K in (typeof FILE_TYPE_LIST)[number]]: any } = {
  class: { icon: "☕", label: "Class" },
  interface: { icon: "⚙️", label: "Interface" },
  component: { icon: "🎨", label: "Component" },
  module: { icon: "📦", label: "Module" },
  config: { icon: "🔧", label: "Configuration" },
} as const;

export type FileType = (typeof FILE_TYPE_LIST)[number];

export function isFileType(value: unknown): value is FileType {
  return typeof value === "string" && FILE_TYPE_LIST.includes(value);
}

export function getFileType(value: unknown): FileType | undefined {
  if (typeof value === "string" && FILE_TYPE_LIST.includes(value)) {
    return value as FileType;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-dependency-relation.ts
export const DEPENDENCY_RELATION_LIST: readonly string[] = [
  "dependency",
  "association",
  "aggregation",
  "composition",
  "implementation",
  "extends",
];

export const DEPENDENCY_RELATION_ICON_MAP: { [K in (typeof DEPENDENCY_RELATION_LIST)[number]]: any } = {
  dependency: { icon: "➡️", label: "Dependency" },
  association: { icon: "🔗", label: "Association" },
  aggregation: { icon: "💎", label: "Aggregation" },
  composition: { icon: "◆", label: "Composition" },
  implementation: { icon: "🛠️", label: "Implementation" },
  extends: { icon: "↗️", label: "Extends" },
} as const;

export type DependencyRelation = (typeof DEPENDENCY_RELATION_LIST)[number];

export function isDependencyRelation(value: unknown): value is DependencyRelation {
  return typeof value === "string" && DEPENDENCY_RELATION_LIST.includes(value);
}

export function getDependencyRelation(value: unknown): DependencyRelation | undefined {
  if (typeof value === "string" && DEPENDENCY_RELATION_LIST.includes(value)) {
    return value as DependencyRelation;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-selected-entity-type.ts
export const SELECTED_ENTITY_TYPE_LIST: readonly string[] = ["node", "member", "edge"];

export const SELECTED_ENTITY_TYPE_ICON_MAP: { [K in (typeof SELECTED_ENTITY_TYPE_LIST)[number]]: any } = {
  node: { icon: "📄", label: "Node" },
  member: { icon: "🧩", label: "Member" },
  edge: { icon: "🔀", label: "Edge" },
} as const;

export type SelectedEntityType = (typeof SELECTED_ENTITY_TYPE_LIST)[number];

export function isSelectedEntityType(value: unknown): value is SelectedEntityType {
  return typeof value === "string" && SELECTED_ENTITY_TYPE_LIST.includes(value);
}

export function getSelectedEntityType(value: unknown): SelectedEntityType | undefined {
  if (typeof value === "string" && SELECTED_ENTITY_TYPE_LIST.includes(value)) {
    return value as SelectedEntityType;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-attribute-visibility.ts
export const ATTRIBUTE_VISIBILITY_LIST: readonly string[] = ["private", "public", "protected"];

export const ATTRIBUTE_VISIBILITY_ICON_MAP: { [K in (typeof ATTRIBUTE_VISIBILITY_LIST)[number]]: any } = {
  private: { icon: "🔒", label: "Private" },
  public: { icon: "🌐", label: "Public" },
  protected: { icon: "🛡️", label: "Protected" },
} as const;

export type AttributeVisibility = (typeof ATTRIBUTE_VISIBILITY_LIST)[number];

export function isAttributeVisibility(value: unknown): value is AttributeVisibility {
  return typeof value === "string" && ATTRIBUTE_VISIBILITY_LIST.includes(value);
}

export function getAttributeVisibility(value: unknown): AttributeVisibility | undefined {
  if (typeof value === "string" && ATTRIBUTE_VISIBILITY_LIST.includes(value)) {
    return value as AttributeVisibility;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-graph-layout.ts
export const GRAPH_LAYOUT_LIST: readonly string[] = ["preset", "grid", "breadthfirst", "cose"];

export const GRAPH_LAYOUT_ICON_MAP: { [K in (typeof GRAPH_LAYOUT_LIST)[number]]: any } = {
  preset: { icon: "📦", label: "Default (Packages)" },
  grid: { icon: "▦", label: "Grid Distribution" },
  breadthfirst: { icon: "🌲", label: "Hierarchical (BFS)" },
  cose: { icon: "🧲", label: "Force-Directed (Cose)" },
} as const;

export type GraphLayout = (typeof GRAPH_LAYOUT_LIST)[number];

export function isGraphLayout(value: unknown): value is GraphLayout {
  return typeof value === "string" && GRAPH_LAYOUT_LIST.includes(value);
}

export function getGraphLayout(value: unknown): GraphLayout | undefined {
  if (typeof value === "string" && GRAPH_LAYOUT_LIST.includes(value)) {
    return value as GraphLayout;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-display-level.ts
export const DISPLAY_LEVEL_LIST: readonly string[] = ["all", "component", "class", "interface", "module", "config"];

export const DISPLAY_LEVEL_ICON_MAP: { [K in (typeof DISPLAY_LEVEL_LIST)[number]]: any } = {
  all: { icon: "👁️", label: "Show All" },
  component: { icon: "🎨", label: "Component" },
  class: { icon: "☕", label: "Class" },
  interface: { icon: "⚙️", label: "Interface" },
  module: { icon: "📦", label: "Module" },
  config: { icon: "🔧", label: "Configuration" },
} as const;

export type DisplayLevel = (typeof DISPLAY_LEVEL_LIST)[number];

export function isDisplayLevel(value: unknown): value is DisplayLevel {
  return typeof value === "string" && DISPLAY_LEVEL_LIST.includes(value);
}

export function getDisplayLevel(value: unknown): DisplayLevel | undefined {
  if (typeof value === "string" && DISPLAY_LEVEL_LIST.includes(value)) {
    return value as DisplayLevel;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/type-rule-pattern.ts
export const RULE_PATTERN_LIST: readonly string[] = ["layer-bypass", "cyclic", "orphan"];

export const RULE_PATTERN_ICON_MAP: { [K in (typeof RULE_PATTERN_LIST)[number]]: any } = {
  "layer-bypass": { icon: "⚠️", label: "Layer bypass detection" },
  cyclic: { icon: "🔄", label: "Cyclic dependencies detected" },
  orphan: { icon: "👻", label: "Orphan methods" },
} as const;

export type RulePattern = (typeof RULE_PATTERN_LIST)[number];

export function isRulePattern(value: unknown): value is RulePattern {
  return typeof value === "string" && RULE_PATTERN_LIST.includes(value);
}

export function getRulePattern(value: unknown): RulePattern | undefined {
  if (typeof value === "string" && RULE_PATTERN_LIST.includes(value)) {
    return value as RulePattern;
  }
  return undefined;
}
EOF

cat << 'EOF' > src/services/codebase/domain/model/types/index.ts
export * from "./type-data-scope";
export * from "./type-impact-direction";
export * from "./type-file-type";
export * from "./type-dependency-relation";
export * from "./type-selected-entity-type";
export * from "./type-attribute-visibility";
export * from "./type-graph-layout";
export * from "./type-display-level";
export * from "./type-rule-pattern";
EOF

# 3. Update codebase.model.ts to re-export types index
cat << 'EOF' > src/services/codebase/domain/model/codebase.model.ts
import {
  AttributeVisibility,
  FileType,
  DependencyRelation,
  SelectedEntityType,
  ImpactDirection
} from './types';

export * from './types';

export interface CodebaseAttribute {
  name: string;
  visibility: AttributeVisibility;
}

export interface CodebaseMethod {
  id: string;
  name: string;
  description: string;
}

export interface ConfigProperty {
  key: string;
  value: string;
}

export interface CodebaseFile {
  id: string;
  name: string;
  type: FileType;
  path: string;
  language: string;
  size: number;
  complexity: number;
  attributes?: CodebaseAttribute[];
  methods?: CodebaseMethod[];
  configProperties?: ConfigProperty[];
}

export interface Dependency {
  id: string;
  sourceNode: string;
  sourceHandle: string;
  targetNode: string;
  targetHandle: string;
  relation: DependencyRelation;
  label: string;
}

export interface CodebaseData {
  files: CodebaseFile[];
  dependencies: Dependency[];
}

export interface SelectedEntity {
  type: SelectedEntityType;
  nodeId: string;
  memberId?: string;
  edgeId?: string;
}

export type { ImpactDirection };
EOF

# 4. Create SelectFromTypeBuilder in src/components/app/ui-utils.tsx
cat << 'EOF' > src/components/app/ui-utils.tsx
import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const SelectFromTypeBuilder = ({
  icon,
  label,
  desc,
  value,
  onChange,
  options
}: {
  icon?: string;
  label: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  options: { icon: string; label: string | React.ReactNode; value: string }[];
}) => (
  <div className="flex flex-col gap-1 py-1">
    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
    {desc && <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">{desc}</span>}
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white dark:bg-neutral-800 text-xs h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="bottom">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.icon}&nbsp;{opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
EOF

# 5. Clean src/lib/utils.ts
cat << 'EOF' > src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
EOF

# 6. Update GraphPanelHeader.tsx to use icon maps for Select controls
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  DISPLAY_LEVEL_LIST,
  DISPLAY_LEVEL_ICON_MAP,
  GRAPH_LAYOUT_LIST,
  GRAPH_LAYOUT_ICON_MAP
} from '@/services/codebase';

export interface GraphPanelHeaderLeftProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = ({ showGrid, setShowGrid }) => (
  <div className="flex items-center gap-2">
    <span>Topological Network</span>
    <Button
      variant="ghost"
      size="icon"
      className={`h-5 w-5 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
      onClick={() => setShowGrid(!showGrid)}
    >
      <Grid size={12} />
    </Button>
  </div>
);

export interface GraphPanelHeaderCenterProps {
  maxNodesLimit: number;
  setMaxNodesLimit: (val: number) => void;
  callersDepth: number;
  setCallersDepth: (val: number) => void;
  calleesDepth: number;
  setCalleesDepth: (val: number) => void;
  displayLevel: string;
  setDisplayLevel: (val: string) => void;
  currentLayout: string;
  setCurrentLayout: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = ({
  maxNodesLimit,
  setMaxNodesLimit,
  callersDepth,
  setCallersDepth,
  calleesDepth,
  setCalleesDepth,
  displayLevel,
  setDisplayLevel,
  currentLayout,
  setCurrentLayout
}) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
      <Input
        type="number"
        min={1}
        max={100}
        className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center"
        value={maxNodesLimit}
        onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)}
      />
    </div>
    <Button className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider">
      <Database size={11} /> Neo4j
    </Button>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <User size={12} className="text-muted-foreground" />
      <Input
        type="number"
        min={0}
        max={20}
        className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
        value={callersDepth}
        onChange={(e) => setCallersDepth(Number(e.target.value) || 0)}
      />
    </div>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <Baby size={12} className="text-muted-foreground" />
      <Input
        type="number"
        min={0}
        max={20}
        className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
        value={calleesDepth}
        onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)}
      />
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={displayLevel} onValueChange={setDisplayLevel}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-32 h-5 text-[11px] text-foreground">
          <SelectValue placeholder="Granularity" />
        </SelectTrigger>
        <SelectContent side="bottom">
          {DISPLAY_LEVEL_LIST.map((key) => {
            const item = DISPLAY_LEVEL_ICON_MAP[key];
            return (
              <SelectItem key={key} value={key}>
                {item.icon}&nbsp;{item.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={currentLayout} onValueChange={setCurrentLayout}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-40 h-5 text-[11px] text-foreground">
          <SelectValue placeholder="Layout Architecture" />
        </SelectTrigger>
        <SelectContent side="bottom">
          {GRAPH_LAYOUT_LIST.map((key) => {
            const item = GRAPH_LAYOUT_ICON_MAP[key];
            return (
              <SelectItem key={key} value={key}>
                {item.icon}&nbsp;{item.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export interface GraphPanelHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef,
  isGraphMaximized,
  setIsGraphMaximized
}) => (
  <div className="flex items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}
    >
      <Plus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}
    >
      <Minus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => {
        cyRef.current?.fit();
        cyRef.current?.center();
      }}
    >
      <Focus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => setIsGraphMaximized(!isGraphMaximized)}
    >
      {isGraphMaximized ? <Minimize size={12} /> : <Maximize size={12} />}
    </Button>
  </div>
);
EOF

# 7. Update RulesFeature.tsx to consume SelectFromTypeBuilder from src/components/app/ui-utils.tsx
cat << 'EOF' > src/features/rules/RulesFeature.tsx
import React, { useState } from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { Play } from 'lucide-react';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { RULE_PATTERN_LIST, RULE_PATTERN_ICON_MAP } from '@/services/codebase';

export function RulesFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const [selectedRule, setSelectedRule] = useState<string>('layer-bypass');

  const leftContent = (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div data-tooltip="Select a pre-configured AST validation rule pattern">
        <SelectFromTypeBuilder
          label="Pre-configured Rule"
          desc="Select a pattern to validate against AST graph"
          value={selectedRule}
          onChange={setSelectedRule}
          options={RULE_PATTERN_LIST.map((key) => ({
            value: key,
            icon: RULE_PATTERN_ICON_MAP[key].icon,
            label: RULE_PATTERN_ICON_MAP[key].label,
          }))}
        />
      </div>
      <div className="flex flex-col flex-1 space-y-1.5">
        <LeftCenterRightPanel
          id="panel-cypher-editor"
          left={<span className="font-medium text-muted-foreground text-xs">Cypher Editor</span>}
          right={<Button variant="ghost" size="sm" className="px-2 h-6 text-primary"><Play size={12} className="mr-1"/> Execute</Button>}
        />
        <Textarea className="flex-1 bg-muted/50 border-border font-mono text-foreground text-xs resize-none" defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"} />
      </div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showLeft: true }}
      panels={{ left: leftContent }}
      headers={{ leftPanelTitle: "Cypher Rules" }}
    />
  );
}
EOF

echo "✅ refactor: Externalized all types into src/services/codebase/domain/model/types and moved SelectFromTypeBuilder to src/components/app/ui-utils.tsx!"

npm run build
