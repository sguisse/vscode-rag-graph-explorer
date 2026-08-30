#!/usr/bin/env bash
set -e

echo "🚀 Synchronizing SidebarLeft.tsx and App.tsx for feature switching and SDLC step transitions..."

# 1. Update SidebarLeft.tsx to properly map and activate features and SDLC workflow steps
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
  FolderGit2,
  Sliders,
  Bot,
  LogOut,
  Sparkles,
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
  { id: 'feature-references', icon: FolderGit2, label: 'Project References', badge: 'New' },
  { id: 'feature-transformer', icon: Sliders, label: 'ETL Transformer', badge: 'New' },
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
      { id: 'INSTRUCTIONS', icon: Sparkles, label: '2. Instructions & Skills' },
      { id: 'LLM_CHAT', icon: MessageSquare, label: '3. LLM Chat' },
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

      {item.children && item.children.length > 0 && (
        <SidebarMenu className="space-y-0.5">
          {item.children.map((child) => {
            const isActive = isItemActive(child.id);
            return renderSidebarMenuItem(
              child,
              isActive,
              () => onItemClick(child),
              sidebarLeftMode,
              true
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
    ['CODEBASE_CONTEXT', 'INSTRUCTIONS', 'LLM_CHAT', 'RESULTS_MANAGER', 'CONFIGURATION', 'VIBE_CODING', 'BMAD_METHOD', 'SPECKIT'].includes(id);

  const isItemActive = (itemId: string): boolean => {
    if (itemId === 'exit-sdlc') return false;
    if (isSdlcActive) {
      if (itemId === 'CODEBASE_CONTEXT') return currentStep === 'CODEBASE_CONTEXT';
      if (itemId === 'INSTRUCTIONS') return ['VIBE_CODING', 'BMAD_METHOD', 'SPECKIT'].includes(currentStep);
      if (itemId === 'LLM_CHAT') return currentStep === 'LLM_CHAT';
      if (itemId === 'RESULTS_MANAGER') return currentStep === 'RESULTS_MANAGER';
      if (itemId === 'CONFIGURATION' || itemId === 'feature-sdlc-config' || itemId === 'feature-configuration') {
        return currentStep === 'CONFIGURATION';
      }
    }
    return activeFeature === itemId || (itemId === 'feature-home' && activeFeature === 'home');
  };

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'exit-sdlc') {
      setActiveFeature('feature-home');
    } else if (item.id === 'feature-sdlc-config' || item.id === 'feature-configuration') {
      setActiveFeature('feature-sdlc');
      transitionTo('CONFIGURATION');
    } else if (item.id === 'feature-sdlc') {
      setActiveFeature('feature-sdlc');
      transitionTo('CODEBASE_CONTEXT');
    } else if (item.id === 'RESULTS_MANAGER') {
      setActiveFeature('feature-sdlc');
      transitionTo('RESULTS_MANAGER');
    } else if (item.id === 'INSTRUCTIONS') {
      setActiveFeature('feature-sdlc');
      transitionTo('BMAD_METHOD');
    } else if (isSdlcStep(item.id)) {
      setActiveFeature('feature-sdlc');
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

# 2. Update App.tsx
cat << 'EOF' > webview/src/App.tsx
import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/_layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { InstallFeature } from '@/features/install/InstallFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { WorkflowBuilderFeature } from '@/features/ai-workflow-builder/WorkflowBuilderFeature';
import { ExporterFeature } from '@/features/exporter/ExporterFeature';
import { ReferencesFeature } from '@/features/references/ReferencesFeature';
import { TransformerFeature } from '@/features/transformer/TransformerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { SdlcFeature } from '@/features/sdlc/SdlcFeature';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { initSessionPersistence } from '@/features/sdlc/core/vscode-sync/session-persistence.manager';
import ExplorerFeature from './features/explorer-old/ExplorerFeature';
import { InstructionsFeature } from './features/sdlc/domains/instructions';

export let vscodeSettings: VsCodeSettings = new VsCodeSettings();

export default function App() {

  const contextStore = typeof useAppContextStore === 'function' ? useAppContextStore() : ({} as any);
  const layoutStore = typeof useLayoutStore === 'function' ? useLayoutStore() : ({} as any);

  const activeFeature = contextStore.activeFeature || 'feature-home';
  const setActiveFeature = contextStore.setActiveFeature;
  const setStatus = useAppContextStore((state) => state.setStatus);
  const isDarkMode = contextStore.isDarkMode;
  const setIsDarkMode = contextStore.setIsDarkMode;
  const notification = contextStore.notification;
  const containers = layoutStore.containers || [];

  // Trigger remote API log on mount
  useEffect(() => {
    logInfo(`SGU App component mounted. Active feature: ${activeFeature}`);
    vsCodeApiService.getExtensionSettings().then((settings: VsCodeSettings) => {
        vscodeSettings = settings;
    });

    // Initialize SDLC session persistence sync
    initSessionPersistence();
  }, []);

  useEffect(() => {
        // Register listener for 'setStatus'
        const unsubscribeStatus = vsCodeHandleMessage.on('updateStatus', (message) => {
            console.info(`Status received from extension: ${message.payload}`);
            if (message.payload) {
                setStatus(message.payload);
            }
        });

        // Cleanup event listeners on unmount
        return () => {
            unsubscribeStatus();
        };
    }, []);

  return (
    <>
      {(activeFeature === 'feature-home') && HomeFeature && <HomeFeature />}
      {(activeFeature === 'feature-install') && InstallFeature && <InstallFeature />}
      {(activeFeature === 'feature-ai-workflow-builder') && WorkflowBuilderFeature && <WorkflowBuilderFeature />}
      {(activeFeature === 'feature-codebase-exporter' || activeFeature === 'feature-exporter') && ExporterFeature && <ExporterFeature />}
      {(activeFeature === 'feature-references') && ReferencesFeature && <ReferencesFeature />}
      {(activeFeature === 'feature-transformer') && TransformerFeature && <TransformerFeature />}
      {(activeFeature === 'feature-layout-demo') && LayoutDemoFeature && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && RulesFeature && <RulesFeature />}
      {(activeFeature === 'feature-help') && HelpFeature && <HelpFeature />}
      {(activeFeature === 'feature-instructions') && InstructionsFeature && <InstructionsFeature />}

      {(activeFeature === 'feature-graph-rag-explorer') && <ExplorerFeature />}
      {(activeFeature === 'feature-sdlc') && <SdlcFeature />}

      {AppLayout && (
        <AppLayout
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notification={notification}
          layoutContainers={containers}
        />
      )}
    </>
  );
}
EOF

echo "✅ fix(navigation): Synchronized SidebarLeft.tsx and App.tsx to correctly dispatch feature activation and SDLC workflow transitions!"
echo "➡️ Rebuilding project..."
npm run build
