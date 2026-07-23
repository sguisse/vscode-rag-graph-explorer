import React from 'react';
import { Search, Upload, Download, Moon, Sun, RotateCcw, Menu,
         PanelLeft, PanelRight, PanelBottom, PanelTop,
         PanelRightDashed,
         SquareMenu,
         InspectionPanel
 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { ToggleButton } from '@/components/app/toggle-button';
import { LayoutVisibilityState, LayoutVisibilityActions } from './hooks/use-layout-state';
import { AppLayoutConfig } from './AppLayout';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';

export interface HeaderProps {
  sidebarLeftMode: 'normal' | 'minimal' | 'collapsed';
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  searchTerm: string;
  onSearchChange?: (val: string) => void;
  isLocked: boolean;
  setImportOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetFilters?: () => void;
  visibility: LayoutVisibilityState;
  actions: LayoutVisibilityActions;
  layoutConfig: AppLayoutConfig;
}

export function Header({
  setSidebarLeftMode,
  searchTerm,
  onSearchChange,
  isLocked,
  setImportOpen,
  setExportOpen,
  isDarkMode,
  setIsDarkMode,
  onResetFilters,
  visibility,
  actions,
  layoutConfig
}: HeaderProps) {
  return (
    <LeftCenterRightPanel
      id="ctn-header"
      className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
      left={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            data-tooltip="Toggle primary navigation drawer"
          >
            <Menu size={16} />
          </Button>
          <div className="flex items-center gap-2 ml-1 text-primary cursor-help">
            <span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace</span>
          </div>
        </>
      }
      center={
        <div className="relative flex items-center w-full max-w-md">
          <Search className="left-2 absolute text-muted-foreground" size={14} />
          <Input
            type="text"
            placeholder="Search for an AST entity (e.g., UserController)..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-muted pl-8 h-8 text-xs"
            disabled={isLocked}
            data-tooltip="Enter FQN token to globally query code index structures"
          />
        </div>
      }
      right={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip={isDarkMode ? "Switch to crisp light mode theme" : "Switch to immersive dark mode theme"}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          {onResetFilters && <Button variant="ghost" size="icon" onClick={onResetFilters} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Reset all workspace visual states, filters, and matrices"><RotateCcw size={16} /></Button>}

          <ToolbarSeparator />

          <ToggleButton
            id="btn-toggle-core-workspace"
            isSelected={visibility.isCtnWorkspaceVisible}
            onToggle={() => actions.setIsCtnWorkspaceVisible(!visibility.isCtnWorkspaceVisible)}
            tooltipText="Toggle core workspace frame canvas wrapper"
            icon={<InspectionPanel size={16} />}
          />

          {layoutConfig.showTop && (
            <ToggleButton
              id="btn-toggle-wkp-top-visibility"
              isSelected={visibility.isCtnWorkspaceTopVisible}
              onToggle={() => actions.setIsCtnWorkspaceTopVisible(!visibility.isCtnWorkspaceTopVisible)}
              icon={<PanelTop size={16} />}
              tooltipText="Toggle workspace mapping path summary rows"
            />
          )}
          {layoutConfig.showLeft && (
            <ToggleButton
                id="btn-toggle-wkp-left-visibility"
              isSelected={visibility.isCtnWorkspaceLeftVisible}
              onToggle={() => actions.setIsCtnWorkspaceLeftVisible(!visibility.isCtnWorkspaceLeftVisible)}
              icon={<PanelLeft size={16} />}
              tooltipText="Toggle multi-layer filter explorer stream"
            />
          )}
          {layoutConfig.showCenter && (
            <ToggleButton
              id="btn-toggle-wkp-center-visibility"
              isSelected={visibility.isCtnWorkspaceCenterVisible}
              onToggle={() => actions.setIsCtnWorkspaceCenterVisible(!visibility.isCtnWorkspaceCenterVisible)}
              tooltipText="Toggle center interactive stage"
              icon={<SquareMenu size={16} />}
            />
          )}
          {layoutConfig.showRight && (
            <ToggleButton
              id="btn-toggle-wkp-right-visibility"
              isSelected={visibility.isCtnWorkspaceRightVisible}
              onToggle={() => actions.setIsCtnWorkspaceRightVisible(!visibility.isCtnWorkspaceRightVisible)}
              icon={<PanelRight size={16} />}
              tooltipText="Toggle right sub-workspace tab inspect matrices"
            />
          )}
          {layoutConfig.showBottom && (
            <ToggleButton
              id="btn-toggle-wkp-bottom-visibility"
              isSelected={visibility.isCtnWorkspaceBottomVisible}
              onToggle={() => actions.setIsCtnWorkspaceBottomVisible(!visibility.isCtnWorkspaceBottomVisible)}
              icon={<PanelBottom size={16} />}
              tooltipText="Toggle bottom system real-time runtime status log bars"
            />
          )}
          {layoutConfig.showRightSidebar && (
            <>
              <ToolbarSeparator />

              <ToggleButton
                id="btn-toggle-sidebar-right-visibility"
                isSelected={visibility.isSidebarRightVisible}
                onToggle={() => actions.setIsSidebarRightVisible(!visibility.isSidebarRightVisible)}
                icon={<PanelRightDashed size={16} />}
                tooltipText="Toggle far-right global identity properties side-drawer"
              />
            </>
          )}
        </div>
      }
    />
  );
}
