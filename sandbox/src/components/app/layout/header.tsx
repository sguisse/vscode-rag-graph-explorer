import React from 'react';
import { Search, Upload, Download, Moon, Sun, RotateCcw, Eye, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';

export interface HeaderProps {
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  searchTerm: string;
  onSearchChange?: (val: string) => void;
  isLocked: boolean;
  setImportOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetFilters?: () => void;
  isCtnWorkspaceVisible: boolean;
  setIsCtnWorkspaceVisible: (visible: boolean) => void;
  isCtnWorkspaceTopVisible: boolean;
  setIsCtnWorkspaceTopVisible: (visible: boolean) => void;
  isCtnWorkspaceLeftVisible: boolean;
  setIsCtnWorkspaceLeftVisible: (visible: boolean) => void;
  isCtnWorkspaceCenterVisible: boolean;
  setIsCtnWorkspaceCenterVisible: (visible: boolean) => void;
  isCtnWorkspaceRightVisible: boolean;
  setIsCtnWorkspaceRightVisible: (visible: boolean) => void;
  isCtnWorkspaceBottomVisible: boolean;
  setIsCtnWorkspaceBottomVisible: (visible: boolean) => void;
  isSidebarRightVisible: boolean;
  setIsSidebarRightVisible: (visible: boolean) => void;
  layoutConfig: {
    showTop?: boolean;
    showLeft?: boolean;
    showCenter?: boolean;
    showRight?: boolean;
    showBottom?: boolean;
    showRightSidebar?: boolean;
  };
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
  isCtnWorkspaceVisible,
  setIsCtnWorkspaceVisible,
  isCtnWorkspaceTopVisible,
  setIsCtnWorkspaceTopVisible,
  isCtnWorkspaceLeftVisible,
  setIsCtnWorkspaceLeftVisible,
  isCtnWorkspaceCenterVisible,
  setIsCtnWorkspaceCenterVisible,
  isCtnWorkspaceRightVisible,
  setIsCtnWorkspaceRightVisible,
  isCtnWorkspaceBottomVisible,
  setIsCtnWorkspaceBottomVisible,
  isSidebarRightVisible,
  setIsSidebarRightVisible,
  layoutConfig
}: HeaderProps) {
  return (
    <LeftCenterRightPanel
      id="ctn-header"
      className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
      left={
        <>
          <Button variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground" data-tooltip="Toggle primary navigation drawer"><Menu size={16} /></Button>
          <div className="flex items-center gap-2 ml-1 text-primary cursor-help"><span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace</span></div>
        </>
      }
      center={
        <div className="relative flex items-center w-full max-w-md">
          <Search className="left-2 absolute text-muted-foreground" size={14} />
          <Input type="text" placeholder="Search for an AST entity (e.g., UserController)..." value={searchTerm} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} className="bg-muted pl-8 h-8 text-xs" disabled={isLocked} data-tooltip="Enter FQN token to globally query code index structures" />
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
          <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceVisible(!isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip="Toggle core workspace frame canvas wrapper"><Eye size={16} /></Button>

          {layoutConfig.showTop && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceTopVisible(!isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle workspace mapping path summary rows"><Eye size={16} /></Button>}
          {layoutConfig.showLeft && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceLeftVisible(!isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle multi-layer filter explorer stream"><Eye size={16} /></Button>}
          {layoutConfig.showCenter && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceCenterVisible(!isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle center interactive stage"><Eye size={16} /></Button>}
          {layoutConfig.showRight && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceRightVisible(!isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle right sub-workspace tab inspect matrices"><Eye size={16} /></Button>}
          {layoutConfig.showBottom && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceBottomVisible(!isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle bottom system real-time runtime status log bars"><Eye size={16} /></Button>}
          {layoutConfig.showRightSidebar && (
            <>
              <div className="mx-1 bg-border w-px h-4"></div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle far-right global identity properties side-drawer"><Eye size={16} /></Button>
            </>
          )}
        </div>
      }
    />
  );
}
