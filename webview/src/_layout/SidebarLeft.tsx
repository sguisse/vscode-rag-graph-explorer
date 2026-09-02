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
  FolderDown,
  FolderGit2,
  Sliders,
  Bot,
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
  { id: 'feature-codebase-exporter', icon: FolderDown, label: 'Codebase Exporter', badge: '' },
  { id: 'feature-references', icon: FolderGit2, label: 'Project References', badge: 'New' },
  { id: 'feature-transformer', icon: Sliders, label: 'ETL Transformer', badge: 'New' },
  {
    id: 'group-sdlc-preparation',
    label: 'SDLC preparation',
    isHeader: true,
    children: [
      { id: 'feature-configuration', icon: Settings, label: 'Configuration', badge: 'New' },
      { id: 'feature-rules', icon: Scale, label: 'Codebase Analytics Rules' },
      { id: 'feature-ai-workflow-builder', icon: Bot, label: 'AI Workflow Builder', badge: 'AI' },
      { id: 'feature-install', icon: PackageCheck, label: 'Install' },
    ],
  },
  {
    id: 'group-sdlc-requests',
    label: 'SDLC Requests',
    isHeader: true,
    children: [
      { id: 'feature-codebase-context', icon: FolderTree, label: '1. Codebase Context' },
      { id: 'feature-instructions', icon: Sparkles, label: '2. Instructions & Ref.' },
      { id: 'feature-llm-chat', icon: MessageSquare, label: '3. LLM Chat' },
    ],
  },
  {
    id: 'group-sdlc-results',
    label: 'SDLC Results',
    isHeader: true,
    children: [
      { id: 'feature-results-manager', icon: Terminal, label: 'Results Manager' },
    ],
  },

  { id: 'feature-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true },
  { id: 'feature-layout-demo', icon: Layout, label: 'Layout Demo', bottom: true },
  { id: 'feature-old-explorer', icon: FolderDown, label: 'Graph RAG Explorer', badge: 'Old', bottom: true },
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

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id.toLowerCase()}`}
        isActive={isActive}
        onClick={onClick}
        style={isChild && !isMinimal ? { paddingLeft: '10px' } : undefined}
        className="relative overflow-hidden transition-colors cursor-pointer"
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

  const effectiveWidth = sidebarLeftMode === 'minimal' ? `${DefaultContainersSize.sidebarLeftMinimizedWidth}px` : '100%';

  const isItemActive = (itemId: string): boolean => {
    return activeFeature === itemId || (itemId === 'feature-home' && activeFeature === 'home');
  };

  const handleItemClick = (item: NavItem) => {
    setActiveFeature(item.id);
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

  const topMenuItems = SIDEBAR_MENU_ITEMS.filter((item) => !item.bottom);
  const bottomMenuItems = SIDEBAR_MENU_ITEMS.filter((item) => item.bottom);

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
