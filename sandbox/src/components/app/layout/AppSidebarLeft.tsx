import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderTree,
  Scale,
  Terminal,
  History,
  Settings,
  HelpCircle,
  FileJson,
  LayoutGrid,
  Home,
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

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  bottom?: boolean;
}

interface AppSidebarLeftProps {
  activeFeature: string;
  setActiveFeature: (feature: string) => void;
  sidebarLeftMode?: 'normal' | 'minimal';
  setSidebarLeftMode?: React.Dispatch<React.SetStateAction<'normal' | 'minimal'>>;
  sidebarLeftWidth?: number;
}

export const SIDEBAR_MENU_ITEMS: NavItem[] = [
  { id: 'panel-welcome', icon: Home, label: 'Home' },
  { id: 'panel-explorer', icon: FolderTree, label: 'AST Explorer', badge: 'New' },
  { id: 'panel-rules', icon: Scale, label: 'Cypher Rules' },
  { id: 'panel-prompt', icon: FileJson, label: 'GraphRAG Prompt' },
  { id: 'panel-terminal', icon: Terminal, label: 'CLI Terminal' },
  { id: 'panel-history', icon: History, label: 'History' },
  { id: 'panel-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'panel-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true },
];

export function renderSidebarMenuItem(
  item: NavItem,
  activeFeature: string,
  setActiveFeature: (feature: string) => void,
  sidebarLeftMode: 'normal' | 'minimal' = 'normal'
) {
  const isActive = activeFeature === item.id;
  const isMinimal = sidebarLeftMode === 'minimal';

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id}`}
        isActive={isActive}
        onClick={() => setActiveFeature(item.id)}
        className="relative overflow-hidden"
        data-tooltip={isMinimal ? item.label : undefined}
      >
        <item.icon size={16} className={sidebarLeftMode === 'normal' ? 'mr-2.5 shrink-0' : 'shrink-0'} />
        {sidebarLeftMode === 'normal' ? (
          <>
            <span className="truncate">{item.label}</span>
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

export function AppSidebarLeft({
  activeFeature,
  setActiveFeature,
  sidebarLeftMode: modeProp,
  setSidebarLeftMode: setModeProp,
  sidebarLeftWidth = 220,
}: AppSidebarLeftProps) {
  const [internalMode, setInternalMode] = useState<'normal' | 'minimal'>('normal');

  const sidebarLeftMode = modeProp ?? internalMode;
  const setSidebarLeftMode = setModeProp ?? setInternalMode;

  const effectiveWidth = sidebarLeftMode === 'minimal' ? '56px' : '100%';

  return (
    <Sidebar
      id="ctn-sidebar-left"
      style={{
        width: effectiveWidth,
        '--sidebar-width': sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`,
      } as React.CSSProperties}
      className="flex flex-col justify-between border-r-0 w-full h-full min-h-0 overflow-x-hidden transition-all duration-200"
    >
      <div className="flex justify-between items-center p-3 border-sidebar-border border-b overflow-hidden shrink-0">
        <h3
          className={`text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 ${
            sidebarLeftMode === 'minimal' ? 'justify-center w-full' : ''
          }`}
        >
          <LayoutGrid size={14} className="text-primary shrink-0" />
          {sidebarLeftMode === 'normal' && <span className="truncate">Features</span>}
        </h3>
      </div>

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

      <SidebarFooter className="p-0 border-sidebar-border border-t overflow-hidden shrink-0">
        <Button
          id="btn-toggle-sidebar-left-mode"
          variant="ghost"
          size="sm"
          onClick={() => setSidebarLeftMode((m) => (m === 'normal' ? 'minimal' : 'normal'))}
          className={`w-full text-muted-foreground hover:text-foreground mt-0 rounded-none h-9 ${
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
