#!/usr/bin/env bash
set -e

echo "🚀 Adding FilesContextPanel to workspace.left for Vibe Coding, BMad Method, and SpecKit..."

# Ensure target directory structures exist
mkdir -p webview/src/features/sdlc/core/workflow
mkdir -p webview/src/features/sdlc/ui-common/containers
mkdir -p webview/src/features/sdlc/ui-common/components
mkdir -p webview/src/features/sdlc/domains/instructions/vibe-coding/components
mkdir -p webview/src/features/sdlc/domains/instructions/bmad-method/components
mkdir -p webview/src/features/sdlc/domains/instructions/speckit/components
mkdir -p webview/src/_layout

# Clean up legacy instructions components
rm -rf webview/src/features/sdlc/domains/bmad-method
rm -rf webview/src/features/sdlc/domains/speckit
rm -rf webview/src/features/sdlc/domains/vibe-coding
rm -rf webview/src/features/sdlc/domains/instructions/components
rm -f webview/src/features/sdlc/domains/instructions/InstructionsFeature.tsx

# -----------------------------------------------------------------------------
# 1. Create FilesContextLeftContainer: Shared container panel for workspace.left
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/ui-common/containers/FilesContextLeftContainer.tsx
import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { FilesContextPanel } from '@/features/sdlc/domains/codebase-context/components/files-selection/files-context';

export function FilesContextLeftContainer() {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Selection tuning" path="workspace.left" />
      <div className="flex-1 p-1.5 min-h-0 overflow-auto">
        <FilesContextPanel />
      </div>
    </div>
  );
}
EOF

# -----------------------------------------------------------------------------
# 2. Update Workflow State Machine: Steps VIBE_CODING, BMAD_METHOD, SPECKIT
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/core/workflow/useSdlcWorkflowMachine.ts
import { create } from 'zustand';

export type SdlcStep =
  | 'CODEBASE_CONTEXT'
  | 'VIBE_CODING'
  | 'BMAD_METHOD'
  | 'SPECKIT'
  | 'LLM_CHAT'
  | 'RESULTS_MANAGER'
  | 'CONFIGURATION';

export interface SdlcWorkflowMachineState {
  currentStep: SdlcStep;
  transitionTo: (step: SdlcStep) => void;
}

/**
 * Headless state machine controlling the active view.
 * SdlcLayoutOrchestrator listens to this to map domains to UI containers.
 */
export const useSdlcWorkflowMachine = create<SdlcWorkflowMachineState>((set) => ({
  currentStep: 'CODEBASE_CONTEXT',
  transitionTo: (step) => set({ currentStep: step })
}));
EOF

# -----------------------------------------------------------------------------
# 3. Create Vibe Coding Feature Component
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/vibe-coding/components/VibeInstructionsPanel.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSdlcSessionStore } from '../../../../core/store/useSdlcSessionStore';

export function VibeInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in">
      <div className="bg-primary/5 p-3 border border-primary/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">Vibe Coding</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Rapid, unstructured prompting. Just tell the LLM what you want to achieve with the selected codebase context.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Instruction Prompt:</label>
        <Textarea
          value={session.instructionsPayload?.promptText || ''}
          onChange={(e) => updateSession(draft => {
            if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'vibe', promptText: '' };
            draft.instructionsPayload.promptText = e.target.value;
          })}
          placeholder="Describe what you want to build or refactor..."
          className="bg-background min-h-[300px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/vibe-coding/VibeCodingFeature.tsx
import React from 'react';
import { VibeInstructionsPanel } from './components/VibeInstructionsPanel';

export function VibeCodingFeature() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-2">
      <VibeInstructionsPanel />
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/vibe-coding/index.ts
export * from './VibeCodingFeature';
export * from './components/VibeInstructionsPanel';
EOF

# -----------------------------------------------------------------------------
# 4. Create BMad Method Feature Component
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/bmad-method/components/BMadInstructionsPanel.tsx
import React from 'react';
import { Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSdlcSessionStore } from '../../../../core/store/useSdlcSessionStore';

const AGENTS_LIST = ['CodeRefactoringAgent', 'SecurityAuditAgent', 'ASTGraphAgent', 'TestGeneratorAgent'];

export function BMadInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  const handleAgentSelect = (val: string | null) => {
    if (!val) return;
    updateSession(draft => {
      if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      draft.instructionsPayload.promptText = `[AGENT]: ${val}\n${draft.instructionsPayload.promptText || ''}`;
    });
  };

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in h-full overflow-y-auto">
      <div className="bg-indigo-500/5 p-3 border border-indigo-500/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">BMad Agent Framework</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Structured prompting leveraging specific Agents and Skills for high-quality, predictable outputs.
        </p>
      </div>

      <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px] text-foreground uppercase"><Bot size={12} className="inline mr-1 text-indigo-400" /> Agent Selection</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Select onValueChange={handleAgentSelect}>
            <SelectTrigger className="w-full bg-background h-8 text-xs">
              <SelectValue placeholder="Select an Agent..." />
            </SelectTrigger>
            <SelectContent>
              {AGENTS_LIST.map((agent) => (
                <SelectItem key={agent} value={agent}>🤖 {agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Structured Prompt:</label>
        <Textarea
          value={session.instructionsPayload?.promptText || ''}
          onChange={(e) => updateSession(draft => {
            if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
            draft.instructionsPayload.promptText = e.target.value;
          })}
          placeholder="[CONTEXT]\n...\n[EXPECTED]\n...\n[OUTPUT FORMAT]\n..."
          className="bg-background min-h-[200px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/bmad-method/BMadMethodFeature.tsx
import React from 'react';
import { BMadInstructionsPanel } from './components/BMadInstructionsPanel';

export function BMadMethodFeature() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-2">
      <BMadInstructionsPanel />
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/bmad-method/index.ts
export * from './BMadMethodFeature';
export * from './components/BMadInstructionsPanel';
EOF

# -----------------------------------------------------------------------------
# 5. Create SpecKit Feature Component
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/speckit/components/SpecKitInstructionsPanel.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSdlcSessionStore } from '../../../../core/store/useSdlcSessionStore';

export function SpecKitInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in">
      <div className="bg-emerald-500/5 p-3 border border-emerald-500/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">SpecKit Driven Dev</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Generate code strictly conforming to functional specifications and test criteria.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Specification Requirements:</label>
        <Textarea
          value={session.instructionsPayload?.promptText || ''}
          onChange={(e) => updateSession(draft => {
            if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'speckit', promptText: '' };
            draft.instructionsPayload.promptText = e.target.value;
          })}
          placeholder="Paste your Gherkin syntax or Markdown specs here..."
          className="bg-background min-h-[300px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/speckit/SpecKitFeature.tsx
import React from 'react';
import { SpecKitInstructionsPanel } from './components/SpecKitInstructionsPanel';

export function SpecKitFeature() {
  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-y-auto font-mono text-xs p-2">
      <SpecKitInstructionsPanel />
    </div>
  );
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/instructions/speckit/index.ts
export * from './SpecKitFeature';
export * from './components/SpecKitInstructionsPanel';
EOF

# -----------------------------------------------------------------------------
# 6. Update instructions domain index
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/index.ts
export * from './vibe-coding';
export * from './bmad-method';
export * from './speckit';
EOF

# -----------------------------------------------------------------------------
# 7. Update SidebarLeft: Display the 5 SDLC workflow steps
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/_layout/SidebarLeft.tsx
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Scale,
  PackageCheck,
  Terminal,
  Settings,
  HelpCircle,
  Home,
  Layout,
  VectorSquare,
  FolderDown,
  Bot,
  LogOut,
  Sparkles,
  FileCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { DefaultContainersSize } from '@/_layout';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useSdlcWorkflowMachine, SdlcStep } from '@/features/sdlc/core/workflow/useSdlcWorkflowMachine';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  bottom?: boolean;
  isHeader?: boolean;
  children?: NavItem[];
}

export interface SidebarLeftProps {
  activeFeature?: string;
  setActiveFeature?: (feature: string) => void;
  sidebarLeftMode?: 'normal' | 'minimal';
  setSidebarLeftMode?: React.Dispatch<React.SetStateAction<'normal' | 'minimal'>>;
  sidebarLeftWidth?: number;
  [key: string]: any;
}

export const SIDEBAR_MENU_ITEMS: NavItem[] = [
  { id: 'feature-home', icon: Home, label: 'Home' },
  { id: 'feature-codebase-exporter', icon: FolderDown, label: 'Codebase Exporter', badge: 'Upd' },
  {
    id: 'group-sdlc',
    label: 'SDLC',
    isHeader: true,
    children: [
      { id: 'feature-sdlc-config', icon: Settings, label: 'Configuration', badge: 'New' },
      { id: 'feature-install', icon: PackageCheck, label: 'Install' },
      { id: 'feature-rules', icon: Scale, label: 'Codebase Analytics Rules' },
      { id: 'feature-ai-workflow-builder', icon: Bot, label: 'AI Workflow Builder', badge: 'AI' },
      { id: 'feature-graph-rag-explorer', icon: FolderDown, label: 'Graph RAG Explorer', badge: 'Old' },
      { id: 'feature-sdlc', icon: VectorSquare, label: 'Workflow', badge: 'New' },
      { id: 'RESULTS_MANAGER', icon: Terminal, label: 'Results Manager' },
    ],
  },
  { id: 'feature-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'feature-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true },
  { id: 'feature-layout-demo', icon: Layout, label: 'Layout Demo', bottom: true },
];

export const SDLC_WORKFLOW_STEPS: NavItem[] = [
  {
    id: 'group-sdlc-workflow',
    label: 'Workflow Steps',
    isHeader: true,
    badge: 'Status',
    children: [
      { id: 'CODEBASE_CONTEXT', icon: FolderTree, label: '1. Codebase Context' },
      { id: 'VIBE_CODING', icon: Sparkles, label: '2. Vibe Coding' },
      { id: 'BMAD_METHOD', icon: Bot, label: '3. BMad Method' },
      { id: 'SPECKIT', icon: FileCheck, label: '4. SpecKit' },
      { id: 'LLM_CHAT', icon: MessageSquare, label: '5. LLM Chat' },
    ],
  },
  { id: 'feature-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true },
  { id: 'exit-sdlc', icon: LogOut, label: 'Close SDLC Workflow', bottom: true },
];

export function renderSidebarMenuItem(
  item: NavItem,
  isActive: boolean,
  onClick: () => void,
  sidebarLeftMode: 'normal' | 'minimal' = 'normal',
  isChild: boolean = false
) {
  const isMinimal = sidebarLeftMode === 'minimal';
  const Icon = item.icon;
  const isDestructive = item.id === 'exit-sdlc';

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id.toLowerCase()}`}
        isActive={isActive}
        onClick={onClick}
        style={isChild && !isMinimal ? { paddingLeft: '10px' } : undefined}
        className={`relative overflow-hidden cursor-pointer transition-colors ${
          isDestructive ? 'text-destructive-foreground hover:bg-destructive-foreground/10' : ''
        }`}
        data-tooltip={isMinimal ? item.label : undefined}
      >
        {Icon && (
          <Icon size={18} className={sidebarLeftMode === 'normal' ? 'mr-2.5 shrink-0' : 'shrink-0'} />
        )}
        {sidebarLeftMode === 'normal' ? (
          <>
            <span className="text-[12px] truncate">{item.label}</span>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </>
        ) : (
          item.badge && (
            <span className="top-0 right-0 absolute bg-primary shadow-2xs px-1 py-0.5 rounded-full font-mono font-bold text-[8px] text-primary-foreground leading-none scale-85 origin-top-right select-none">
              {item.badge}
            </span>
          )
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function renderHeaderGroupItem(
  item: NavItem,
  isItemActive: (id: string) => boolean,
  onItemClick: (item: NavItem) => void,
  sidebarLeftMode: 'normal' | 'minimal' = 'normal'
) {
  const isMinimal = sidebarLeftMode === 'minimal';
  const Icon = item.icon;

  return (
    <div key={item.id} className="space-y-1 my-1">
      {/* Group Header Row */}
      {sidebarLeftMode === 'normal' ? (
        <div className="flex justify-between items-center px-2.5 py-1.5 font-mono font-bold text-[14px] text-muted-foreground uppercase tracking-wider select-none">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-primary" />}
            <span>{item.label}</span>
          </div>
          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
        </div>
      ) : (
        <div
          className="flex justify-center py-1.5 text-muted-foreground"
          data-tooltip={item.label}
        >
          {Icon ? <Icon size={16} /> : <span className="font-bold text-[10px]">{item.label.substring(0, 2)}</span>}
        </div>
      )}

      {/* Nested Children Items */}
      {item.children && item.children.length > 0 && (
        <SidebarMenu className="space-y-0.5">
          {item.children.map((child) => {
            const isActive = isItemActive(child.id);
            return renderSidebarMenuItem(
              child,
              isActive,
              () => onItemClick(child),
              sidebarLeftMode,
              true // applies 10px left padding
            );
          })}
        </SidebarMenu>
      )}
    </div>
  );
}

export function SidebarLeft(props: SidebarLeftProps) {
  const storeActiveFeature = useAppContextStore((s) => s.activeFeature);
  const storeSetActiveFeature = useAppContextStore((s) => s.setActiveFeature);

  const activeFeature = props.activeFeature || storeActiveFeature;
  const setActiveFeature = props.setActiveFeature || storeSetActiveFeature;

  const [internalMode, setInternalMode] = useState<'normal' | 'minimal'>('normal');
  const sidebarLeftMode = props.sidebarLeftMode ?? internalMode;
  const setSidebarLeftMode = props.setSidebarLeftMode ?? setInternalMode;
  const sidebarLeftWidth = props.sidebarLeftWidth ?? DefaultContainersSize.sidebarLeftWidth;

  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);
  const transitionTo = useSdlcWorkflowMachine((s) => s.transitionTo);

  const isSdlcActive = activeFeature === 'feature-sdlc' || activeFeature === 'feature-graph-rag-explorer';
  const effectiveWidth = sidebarLeftMode === 'minimal' ? `${DefaultContainersSize.sidebarLeftMinimizedWidth}px` : '100%';

  const isSdlcStep = (id: string) =>
    ['CODEBASE_CONTEXT', 'VIBE_CODING', 'BMAD_METHOD', 'SPECKIT', 'LLM_CHAT', 'RESULTS_MANAGER', 'CONFIGURATION'].includes(id);

  const isItemActive = (itemId: string): boolean => {
    if (itemId === 'exit-sdlc') return false;
    if (isSdlcActive && isSdlcStep(itemId)) {
      return currentStep === itemId;
    }
    return activeFeature === itemId || (itemId === 'feature-home' && activeFeature === 'home');
  };

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'exit-sdlc') {
      setActiveFeature('feature-home');
    } else if (item.id === 'feature-sdlc-config') {
      setActiveFeature('feature-sdlc');
      transitionTo('CONFIGURATION');
    } else if (item.id === 'feature-sdlc') {
      setActiveFeature('feature-sdlc');
      transitionTo('CODEBASE_CONTEXT');
    } else if (isSdlcActive && isSdlcStep(item.id)) {
      transitionTo(item.id as SdlcStep);
    } else {
      setActiveFeature(item.id);
    }
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      if (item.isHeader) {
        return renderHeaderGroupItem(item, isItemActive, handleItemClick, sidebarLeftMode);
      }
      return renderSidebarMenuItem(
        item,
        isItemActive(item.id),
        () => handleItemClick(item),
        sidebarLeftMode
      );
    });
  };

  const activeMenuItems = isSdlcActive ? SDLC_WORKFLOW_STEPS : SIDEBAR_MENU_ITEMS;
  const topMenuItems = activeMenuItems.filter((item) => !item.bottom);
  const bottomMenuItems = activeMenuItems.filter((item) => item.bottom);

  return (
    <Sidebar
      id="ctn-sidebar-left"
      style={{
        width: effectiveWidth,
        '--sidebar-width': sidebarLeftMode === 'minimal' ? `${DefaultContainersSize.sidebarLeftMinimizedWidth}px` : `${sidebarLeftWidth}px`,
      } as React.CSSProperties}
      className="flex flex-col justify-between border-r-0 w-full h-full min-h-0 overflow-x-hidden transition-all duration-200"
    >
      <SidebarContent className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
        <SidebarGroup>
          <SidebarMenu>
            {renderNavItems(topMenuItems)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pt-2 border-sidebar-border border-t">
          <SidebarMenu>
            {renderNavItems(bottomMenuItems)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0 border-sidebar-border border-t h-9 overflow-hidden shrink-0">
        <Button
          id="btn-toggle-sidebar-left-mode"
          variant="ghost"
          size="sm"
          onClick={() => setSidebarLeftMode((m) => (m === 'normal' ? 'minimal' : 'normal'))}
          className={`w-full text-muted-foreground hover:text-foreground mt-0 rounded-none h-9 cursor-pointer ${
            sidebarLeftMode === 'normal' ? 'justify-end px-3' : 'justify-center px-0'
          }`}
          data-tooltip="Toggle sidebar drawer size"
        >
          {sidebarLeftMode === 'normal' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
EOF

# -----------------------------------------------------------------------------
# 8. Update SdlcSidebarMenu
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/ui-common/components/SdlcSidebarMenu.tsx
import React from 'react';
import { SidebarLeft } from '@/_layout/SidebarLeft';

export function SdlcSidebarMenu() {
  return <SidebarLeft activeFeature="feature-sdlc" />;
}
EOF

# -----------------------------------------------------------------------------
# 9. Update SdlcLayoutOrchestrator: Configure workspace.left for Instruction Features
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/SdlcLayoutOrchestrator.tsx
import React, { useEffect, useRef } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useSdlcWorkflowMachine } from './core/workflow/useSdlcWorkflowMachine';

import { SdlcSidebarMenu } from './ui-common/components/SdlcSidebarMenu';
import { CodebaseContextFeature } from './domains/codebase-context';
import { VibeCodingFeature, BMadMethodFeature, SpecKitFeature } from './domains/instructions';
import { LlmFeature } from './domains/llm-chat';
import { ResultsManagerFeature } from './domains/results-manager';
import { ConfigurationFeature } from './domains/configuration';
import { FilesContextLeftContainer } from './ui-common/containers/FilesContextLeftContainer';

export function SdlcLayoutOrchestrator() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const currentStep = useSdlcWorkflowMachine((s) => s.currentStep);
  const lastSetStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastSetStepRef.current === currentStep) return;
    lastSetStepRef.current = currentStep;

    const defaultSidebarLeft = {
      visible: true,
      container: <SdlcSidebarMenu />,
      isResizable: true,
      isHiddable: true,
    };

    const defaultInstructionLayout = (content: React.ReactNode) => ({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: defaultSidebarLeft,
      workspace: {
        top: { visible: false },
        left: {
          visible: true,
          container: <FilesContextLeftContainer />,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' as const },
        },
        center: {
          visible: true,
          container: content,
          isResizable: false,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' as const },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });

    const defaultSingleCenterLayout = (content: React.ReactNode) => ({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: defaultSidebarLeft,
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: content,
          isResizable: false,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' as const },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });

    if (currentStep === 'VIBE_CODING') {
      setLayoutContainers(defaultInstructionLayout(<VibeCodingFeature />));
    } else if (currentStep === 'BMAD_METHOD') {
      setLayoutContainers(defaultInstructionLayout(<BMadMethodFeature />));
    } else if (currentStep === 'SPECKIT') {
      setLayoutContainers(defaultInstructionLayout(<SpecKitFeature />));
    } else if (currentStep === 'LLM_CHAT') {
      setLayoutContainers(defaultSingleCenterLayout(<LlmFeature />));
    } else if (currentStep === 'RESULTS_MANAGER') {
      setLayoutContainers(defaultSingleCenterLayout(<ResultsManagerFeature />));
    } else if (currentStep === 'CONFIGURATION') {
      setLayoutContainers(defaultSingleCenterLayout(<ConfigurationFeature />));
    }
  }, [currentStep, setLayoutContainers]);

  if (currentStep === 'CODEBASE_CONTEXT') {
    return <CodebaseContextFeature />;
  }

  return null;
}
EOF

echo "✅ feat: Mounted FilesContextPanel on workspace.left across Vibe Coding, BMad Method, and SpecKit steps with shared SDLC domain store data!"
