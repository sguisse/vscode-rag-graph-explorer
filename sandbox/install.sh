#!/usr/bin/env bash
set -e

# Create target directories
mkdir -p src/components/app/layout

# 1. Create the externalized Header component
cat << 'EOF' > src/components/app/layout/header.tsx
import React from 'react';
import { LeftCenterRightPanel } from '../left-center-right-panel';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export function Header({ activeView, setActiveView, isDarkMode, setIsDarkMode }: HeaderProps) {
  return (
    <LeftCenterRightPanel
      id="ctn-header"
      className="bg-card border-b border-border h-12 px-4 w-full select-none shrink-0 z-40"
      left={
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-sm tracking-tight text-foreground">RAG Graph Explorer</span>
          <div className="flex gap-1 ml-4">
            {['panel-explorer', 'panel-welcome', 'panel-rules', 'panel-help'].map((view) => (
              <Button
                key={view}
                variant={activeView === view ? 'default' : 'ghost'}
                size="xs"
                onClick={() => setActiveView(view)}
                className="capitalize"
              >
                {view.replace('panel-', '')}
              </Button>
            ))}
          </div>
        </div>
      }
      right={
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-muted-foreground"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      }
    />
  );
}
EOF

# 2. Create the externalized Footer component
cat << 'EOF' > src/components/app/layout/footer.tsx
import React from 'react';
import { LeftCenterRightPanel } from '../left-center-right-panel';

export function Footer() {
  return (
    <LeftCenterRightPanel
      id="ctn-footer"
      className="bg-card border-t border-border h-10 px-4 w-full fixed bottom-0 left-0 right-0 select-none shrink-0 z-40 text-xs font-mono text-muted-foreground"
      left={
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Workspace Context Map Connected</span>
        </div>
      }
      center={
        <div>v1.0.0-sandbox</div>
      }
      right={
        <div>Environment: Active Live Proxy</div>
      }
    />
  );
}
EOF

# 3. Create the production-ready AppLayout with modular Header and fixed Footer integration
cat << 'EOF' > src/components/app/layout/AppLayout.tsx
import React from 'react';
import { Header } from './header';
import { Footer } from './footer';
import { ResizableContainer } from '../container/ResizableContainer';

export interface AppLayoutProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isLocked?: boolean;
  setIsLocked?: (locked: boolean) => void;
  isGraphMaximized?: boolean;
  layoutConfig: {
    showTop?: boolean;
    showLeft?: boolean;
    showCenter?: boolean;
    showRight?: boolean;
    showBottom?: boolean;
    showRightSidebar?: boolean;
  };
  notification?: string | null;
  panels: {
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    top?: React.ReactNode;
    bottom?: React.ReactNode;
    rightSidebar?: React.ReactNode;
  };
  headers?: {
    leftPanelTitle?: React.ReactNode;
    centerPanelHeader?: React.ReactNode;
    centerPanelHeaderCenter?: React.ReactNode;
    centerPanelHeaderRight?: React.ReactNode;
    rightSidebarHeader?: React.ReactNode;
    rightSidebarHeaderRight?: React.ReactNode;
  };
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onResetFilters?: () => void;
}

export function AppLayout({
  activeView,
  setActiveView,
  isDarkMode,
  setIsDarkMode,
  isGraphMaximized,
  layoutConfig,
  notification,
  panels,
  headers
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden pb-10">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {notification && (
        <div className="fixed top-14 right-4 z-50 bg-slate-900 text-slate-100 border border-slate-700 rounded-md px-3 py-1.5 shadow-lg text-xs font-mono animate-in fade-in duration-200">
          {notification}
        </div>
      )}

      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {layoutConfig.showLeft && !isGraphMaximized && (
          <ResizableContainer
            id="left-panel"
            className="w-80 border-r border-border h-full"
            headerLeft={headers?.leftPanelTitle}
          >
            {panels.left}
          </ResizableContainer>
        )}

        <div className="flex flex-col flex-1 min-w-0 h-full relative">
          {layoutConfig.showTop && panels.top && (
            <div className="border-b border-border shrink-0 bg-muted/30">
              {panels.top}
            </div>
          )}

          <div className="flex-1 min-h-0 relative">
            {layoutConfig.showCenter && panels.center}
          </div>

          {layoutConfig.showBottom && panels.bottom && (
            <div className="border-t border-border shrink-0 bg-muted/30">
              {panels.bottom}
            </div>
          )}
        </div>

        {layoutConfig.showRight && !isGraphMaximized && (
          <ResizableContainer
            id="right-panel"
            className="w-96 border-l border-border h-full"
            headerLeft={headers?.centerPanelHeader}
            headerCenter={headers?.centerPanelHeaderCenter}
            headerRight={headers?.centerPanelHeaderRight}
          >
            {panels.right}
          </ResizableContainer>
        )}

        {layoutConfig.showRightSidebar && panels.rightSidebar && !isGraphMaximized && (
          <ResizableContainer
            id="right-sidebar"
            className="w-72 border-l border-border h-full"
            headerLeft={headers?.rightSidebarHeader}
            headerRight={headers?.rightSidebarHeaderRight}
          >
            {panels.rightSidebar}
          </ResizableContainer>
        )}
      </div>

      <Footer />
    </div>
  );
}
EOF

echo "✅ refactor: Extracted Header & fixed 40px layout Footer into dedicated files, successfully re-architected AppLayout.tsx!"
