import React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutDashboard, FolderTree, Scale, Terminal, History, Settings, HelpCircle, FileJson } from 'lucide-react';

const SIDEBAR_MENU_ITEMS = [
  { id: 'panel-welcome', icon: LayoutDashboard, label: 'Home' },
  { id: 'panel-explorer', icon: FolderTree, label: 'AST Explorer', badge: 'New' },
  { id: 'panel-rules', icon: Scale, label: 'Cypher Rules' },
  { id: 'panel-prompt', icon: FileJson, label: 'GraphRAG Prompt' },
  { id: 'panel-terminal', icon: Terminal, label: 'CLI Terminal' },
  { id: 'panel-history', icon: History, label: 'History' },
  { id: 'panel-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'panel-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true }
];

export interface SidebarLeftProps {
  sidebarLeftMode: 'normal' | 'minimal' | 'collapsed';
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarLeftWidth: number;
  startSidebarLeftResize: (e: React.MouseEvent) => void;
  isDraggingSidebarLeft: boolean;
}

export function SidebarLeft({
  sidebarLeftMode,
  setSidebarLeftMode,
  activeView,
  setActiveView,
  sidebarLeftWidth,
  startSidebarLeftResize,
  isDraggingSidebarLeft
}: SidebarLeftProps) {
  if (sidebarLeftMode === 'collapsed') return null;

  const renderSidebarMenuItem = (item: any) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id}`}
        isActive={activeView === item.id}
        onClick={() => setActiveView(item.id)}
        title={sidebarLeftMode === 'minimal' ? item.label : undefined}
        className="relative"
      >
        <item.icon size={16} className={sidebarLeftMode === 'normal' ? "mr-2.5 shrink-0" : "shrink-0"} />
        {sidebarLeftMode === 'normal' ? (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </>
        ) : (
          item.badge && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground font-mono font-bold text-[8px] px-1 py-0.5 rounded-full select-none scale-85 origin-top-right shadow-2xs leading-none">
              {item.badge}
            </span>
          )
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      id="ctn-sidebar-left"
      style={{
        width: sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`,
        '--sidebar-width': `${sidebarLeftWidth}px`,
        transition: isDraggingSidebarLeft ? 'none' : undefined
      } as React.CSSProperties}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.filter(item => !item.bottom).map(renderSidebarMenuItem)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto pt-2 border-sidebar-border border-t">
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.filter(item => item.bottom).map(renderSidebarMenuItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarLeftMode(m => m === 'normal' ? 'minimal' : 'normal')}
          className={`w-full text-muted-foreground hover:text-foreground ${sidebarLeftMode === 'normal' ? 'justify-end' : 'justify-center'}`}
          data-tooltip="Toggle sidebar drawer size"
        >
          {sidebarLeftMode === 'normal' ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </Button>
      </SidebarFooter>
      {sidebarLeftMode === 'normal' && (
        <div className="group top-0 right-0 bottom-0 z-20 absolute hover:bg-sidebar-border w-1 cursor-col-resize" onMouseDown={startSidebarLeftResize} />
      )}
    </Sidebar>
  );
}
