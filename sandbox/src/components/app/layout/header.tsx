import React from 'react';
import { Search, Upload, Download, Moon, Sun, RotateCcw, Eye, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { LayoutVisibilityState, LayoutVisibilityActions } from './hooks/use-layout-state';
import { AppLayoutConfig } from './AppLayout';

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
          <Button variant="ghost" size="icon" onClick={() => setImportOpen(true)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Import local AST JSON/YAML schema payload extracts"><Upload size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setExportOpen(true)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Export current topological session structure"><Download size={16} /></Button>
          <div className="mx-1 bg-border w-px h-4"></div>
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip={isDarkMode ? "Switch to crisp light mode theme" : "Switch to immersive dark mode theme"}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          {onResetFilters && <Button variant="ghost" size="icon" onClick={onResetFilters} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Reset all workspace visual states, filters, and matrices"><RotateCcw size={16} /></Button>}
          <div className="mx-1 bg-border w-px h-4"></div>
          <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceVisible(!visibility.isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip="Toggle core workspace frame canvas wrapper"><Eye size={16} /></Button>

          {layoutConfig.showTop && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceTopVisible(!visibility.isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle workspace mapping path summary rows"><Eye size={16} /></Button>}
          {layoutConfig.showLeft && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceLeftVisible(!visibility.isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle multi-layer filter explorer stream"><Eye size={16} /></Button>}
          {layoutConfig.showCenter && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceCenterVisible(!visibility.isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle center interactive stage"><Eye size={16} /></Button>}
          {layoutConfig.showRight && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceRightVisible(!visibility.isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle right sub-workspace tab inspect matrices"><Eye size={16} /></Button>}
          {layoutConfig.showBottom && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceBottomVisible(!visibility.isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle bottom system real-time runtime status log bars"><Eye size={16} /></Button>}
          {layoutConfig.showRightSidebar && (
            <>
              <div className="mx-1 bg-border w-px h-4"></div>
              <Button variant="ghost" size="icon" onClick={() => actions.setIsSidebarRightVisible(!visibility.isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle far-right global identity properties side-drawer"><Eye size={16} /></Button>
            </>
          )}
        </div>
      }
    />
  );
}
