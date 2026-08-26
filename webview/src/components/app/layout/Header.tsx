import React from 'react';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { headerLeftWidth } from '@/constants/layout-constants';
import {
  Layers,
  Moon,
  Sun,
  CheckCircle2,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  PanelLeftOpen,
  PanelRightOpen,
  Workflow,
} from 'lucide-react';
import { PanelCenter } from '@/components/app/core/icons/PanelCenter';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { ToggleButton } from '@/components/app/toggle-button';
import { useLayoutStore } from '@/store/useLayoutStore';
import logoLight from '@assets/logo-light.png';
import logoDark from '@assets/logo-dark.png';
import { DefaultContainersSize } from '@/constants/layout-constants';
import { ApplicationTitle } from '../ApplicationTitle';
import { WorkflowPopup } from '@/components/app/workflow/workflow-popup';
import { useExplorerWorkflow } from '@/features/explorer-old/workflow/hooks/use-explorer-workflow';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  activeFeature: string;
  setActiveFeature?: (feature: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  notification?: string | null;
}

export function Header({
  activeFeature,
  isDarkMode,
  setIsDarkMode,
  notification,
}: HeaderProps) {
  const toggleContainerVisible = useLayoutStore((s) => s.toggleContainerVisible);
  const containers = useLayoutStore((s) => s.containers);
  const { dataWorkflow, handleSelectStep } = useExplorerWorkflow();

  const leftContent = (
    <div id="app-logo-title" className="flex items-center gap-2">
      <span id="app-logo" className="w-5 h-5">
        <img src={isDarkMode ? logoDark : logoLight} alt="App Logo" className="w-full h-full object-contain" />
      </span>
      <span id="app-title" className="font-bold text-foreground text-sm tracking-tight">
        <ApplicationTitle label='Token Ra$or'/>
      </span>
    </div>
  );

  const centerContent = (
    <div className="flex flex-1 justify-between items-center gap-2 w-full">
      <div className="flex items-center gap-2 shrink-0">
        <span style={{ paddingLeft: `${DefaultContainersSize.sidebarLeftWidth - headerLeftWidth}px` }}>
          <ToggleButton
            id="toggle-sidebar-left"
            isSelected={!!containers.sidebarLeft?.visible}
            onToggle={() => toggleContainerVisible('sidebarLeft')}
            tooltipText="Toggle Sidebar Left"
            icon={<Layers size={14} />}
          />
        </span>
        <span id="active-feature" className="bg-primary/15 px-2 py-0.5 rounded font-semibold text-[10px] text-primary">
          {activeFeature}
        </span>
      </div>

      {/* Centered Workflow Button & Reusable Component Popup */}
      <div className="flex flex-1 justify-center items-center">
        <WorkflowPopup
          side="bottom"
          align="center"
          workflowData={dataWorkflow}
          onSelectStep={handleSelectStep}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 hover:bg-primary/10 px-2.5 border-border h-6 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            data-tooltip="View Pipeline Workflow"
          >
            <Workflow size={13} className="text-primary" />
            <span className="font-semibold text-[11px]">Workflow</span>
          </Button>
        </WorkflowPopup>
      </div>

      <div className="w-24 shrink-0" />
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-0.5">
      {notification && (
        <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded text-[11px] text-emerald-500">
          <CheckCircle2 size={12} />
          <span>{notification}</span>
        </div>
      )}

      <ToggleButton
        id="toggle-theme-mode"
        isSelected={isDarkMode}
        onToggle={() => setIsDarkMode(!isDarkMode)}
        tooltipText={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        icon={isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
      />

      <ToolbarSeparator />

      <ToggleButton
        id="toggle-sidebar-left-02"
        isSelected={!!containers.sidebarLeft?.visible}
        onToggle={() => toggleContainerVisible('sidebarLeft')}
        tooltipText="Toggle Sidebar Left"
        icon={<PanelLeft size={14} />}
      />

      <ToolbarSeparator orientation='HORIZONTAL'/>

      <ToggleButton
        id="toggle-wkp-top"
        isSelected={!!containers.workspace?.top?.visible}
        onToggle={() => toggleContainerVisible('workspace.top')}
        tooltipText="Toggle Workspace Top"
        icon={<PanelTop size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-left"
        isSelected={!!containers.workspace?.left?.visible}
        onToggle={() => toggleContainerVisible('workspace.left')}
        tooltipText="Toggle Workspace Left"
        icon={<PanelLeftOpen size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-center"
        isSelected={!!containers.workspace?.center?.visible}
        onToggle={() => toggleContainerVisible('workspace.center')}
        tooltipText="Toggle Workspace Center"
        icon={<PanelCenter size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-right"
        isSelected={!!containers.workspace?.right?.visible}
        onToggle={() => toggleContainerVisible('workspace.right')}
        tooltipText="Toggle Workspace Right"
        icon={<PanelRightOpen size={14} />}
      />
      <ToggleButton
        id="toggle-wkp-bottom"
        isSelected={!!containers.workspace?.bottom?.visible}
        onToggle={() => toggleContainerVisible('workspace.bottom')}
        tooltipText="Toggle Workspace Bottom"
        icon={<PanelBottom size={14} />}
      />

      <ToolbarSeparator orientation='HORIZONTAL'/>

      <ToggleButton
        id="toggle-sidebar-right"
        isSelected={!!containers.sidebarRight?.visible}
        onToggle={() => toggleContainerVisible('sidebarRight')}
        tooltipText="Toggle Sidebar Right"
        icon={<PanelRight size={14} />}
      />
    </div>
  );

  return (
    <LeftCenterRightPanel
      id="app-header-panel"
      className="bg-secondary/80 px-2 border-border border-b h-10 font-mono text-foreground text-xs select-none"
      style={{ height: `${DefaultContainersSize.headerHeight}px` }}
      left={leftContent}
      center={centerContent}
      right={rightContent}
    />
  );
}
