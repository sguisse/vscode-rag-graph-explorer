#!/usr/bin/env bash
set -e

# Target directories
EXPORTER_DIR="webview/src/features/exporter"
LAYOUT_DIR="webview/src/components/app/layout"
SRC_DIR="webview/src"

mkdir -p "${EXPORTER_DIR}"
mkdir -p "${LAYOUT_DIR}"

# 1. Create ExporterPanel.tsx
cat << 'EOF' > "${EXPORTER_DIR}/ExporterPanel.tsx"
import React from 'react';
import { Card } from '@/components/ui/card';
import { FolderDown, Sparkles, Clock } from 'lucide-react';

export function ExporterPanel() {
  return (
    <div className="flex-1 space-y-4 bg-background p-4 md:p-6 min-h-0 overflow-y-auto text-foreground flex items-center justify-center">
      <Card className="max-w-md w-full bg-card/80 border border-primary/20 p-8 shadow-lg text-center flex flex-col items-center gap-4">
        <div className="bg-primary/10 p-4 rounded-full text-primary">
          <FolderDown size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-bold text-lg text-foreground flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-primary animate-pulse" />
            Codebase Exporter
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Actual Exporter extension to migrate in this feature coming soon.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-[11px] font-mono text-muted-foreground">
          <Clock size={12} />
          <span>Under Active Migration</span>
        </div>
      </Card>
    </div>
  );
}

export default ExporterPanel;
EOF

# 2. Create ExporterFeature.tsx
cat << 'EOF' > "${EXPORTER_DIR}/ExporterFeature.tsx"
import React, { useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ExporterPanel } from './ExporterPanel';

export function ExporterFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: <ExporterPanel />,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

export default ExporterFeature;
EOF

# 3. Update SidebarLeft.tsx to ensure menu link is present
cat << 'EOF' > "${LAYOUT_DIR}/SidebarLeft.tsx"
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Scale,
  PackageCheck,
  Terminal,
  History,
  Settings,
  HelpCircle,
  FileJson,
  LayoutGrid,
  Home,
  Layout,
  VectorSquare,
  FolderDown,
  Bot,
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
import { DefaultContainersSize } from '@/constants/layout-constants';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  bottom?: boolean;
}

interface SidebarLeftProps {
  activeFeature: string;
  setActiveFeature: (feature: string) => void;
  sidebarLeftMode?: 'normal' | 'minimal';
  setSidebarLeftMode?: React.Dispatch<React.SetStateAction<'normal' | 'minimal'>>;
  sidebarLeftWidth?: number;
}

export const SIDEBAR_MENU_ITEMS: NavItem[] = [
  { id: 'feature-home', icon: Home, label: 'Home' },
  { id: 'feature-install', icon: PackageCheck, label: 'Install' },
  { id: 'feature-graph-rag-explorer', icon: VectorSquare, label: 'Graph RAG Explorer', badge: 'New' },
  { id: 'feature-ai-workflow-builder', icon: Bot, label: 'AI Workflow Builder', badge: 'AI' },
  { id: 'feature-codebase-exporter', icon: FolderDown, label: 'Codebase Exporter', badge: 'Upd' },
  { id: 'feature-rules', icon: Scale, label: 'Cypher Rules' },

  { id: 'feature-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'feature-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true },
  { id: 'feature-layout-demo', icon: Layout, label: 'Layout Demo', bottom: true },
];

export function renderSidebarMenuItem(
  item: NavItem,
  activeFeature: string,
  setActiveFeature: (feature: string) => void,
  sidebarLeftMode: 'normal' | 'minimal' = 'normal'
) {
  const isActive = activeFeature === item.id || (item.id === 'feature-home' && activeFeature === 'home');
  const isMinimal = sidebarLeftMode === 'minimal';

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id}`}
        isActive={isActive}
        onClick={() => setActiveFeature(item.id)}
        className="relative overflow-hidden cursor-pointer"
        data-tooltip={isMinimal ? item.label : undefined}
      >
        <item.icon size={18} className={sidebarLeftMode === 'normal' ? 'mr-2.5 shrink-0' : 'shrink-0'} />
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

export function SidebarLeft({
  activeFeature,
  setActiveFeature,
  sidebarLeftMode: modeProp,
  setSidebarLeftMode: setModeProp,
  sidebarLeftWidth = DefaultContainersSize.sidebarLeftWidth,
}: SidebarLeftProps) {
  const [internalMode, setInternalMode] = useState<'normal' | 'minimal'>('normal');

  const sidebarLeftMode = modeProp ?? internalMode;
  const setSidebarLeftMode = setModeProp ?? setInternalMode;

  const effectiveWidth = sidebarLeftMode === 'minimal' ? `${DefaultContainersSize.sidebarLeftMinimizedWidth}px` : '100%';

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
            {SIDEBAR_MENU_ITEMS.filter((item) => !item.bottom).map((item) =>
              renderSidebarMenuItem(item, activeFeature, setActiveFeature, sidebarLeftMode)
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto pt-2 border-sidebar-border border-t">
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.filter((item) => item.bottom).map((item) =>
              renderSidebarMenuItem(item, activeFeature, setActiveFeature, sidebarLeftMode)
            )}
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

# 4. Update App.tsx to register ExporterFeature route
cat << 'EOF' > "${SRC_DIR}/App.tsx"
import React, { useEffect } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { HomeFeature } from '@/features/home/HomeFeature';
import { InstallFeature } from '@/features/install/InstallFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { WorkflowBuilderFeature } from '@/features/ai-workflow-builder/WorkflowBuilderFeature';
import { ExporterFeature } from '@/features/exporter/ExporterFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';

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
      {(activeFeature === 'feature-graph-rag-explorer') && ExplorerFeature && <ExplorerFeature />}
      {(activeFeature === 'feature-ai-workflow-builder') && WorkflowBuilderFeature && <WorkflowBuilderFeature />}
      {(activeFeature === 'feature-codebase-exporter' || activeFeature === 'feature-exporter') && ExporterFeature && <ExporterFeature />}
      {(activeFeature === 'feature-layout-demo') && LayoutDemoFeature && <LayoutDemoFeature />}
      {(activeFeature === 'feature-rules') && RulesFeature && <RulesFeature />}
      {(activeFeature === 'feature-help') && HelpFeature && <HelpFeature />}

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

echo "✅ feat: Created ExporterFeature & ExporterPanel, connected to SidebarLeft navigation and App.tsx!"
