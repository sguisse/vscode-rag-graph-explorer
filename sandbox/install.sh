#!/usr/bin/env bash
set -e

echo "🚀 Fixing data-tooltip initialization and component rendering..."

mkdir -p src/components/app
mkdir -p src/components/app/layout

# 1. Update Tooltip component with optimized mouse event handling & responsive default delay (300ms)
cat << 'EOF' > src/components/app/tooltip.tsx
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface TooltipProps {
  delay?: number;
}

export function Tooltip({ delay = 300 }: TooltipProps) {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  const [coords, setCoords] = useState<{
    tooltipLeft: number;
    tooltipTop: number;
    arrowTop: number;
    side: 'left' | 'right';
  }>({
    tooltipLeft: 0,
    tooltipTop: 0,
    arrowTop: 0,
    side: 'right',
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTargetRef = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (!tooltipRef.current) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const tooltipWidth = tooltipRef.current.offsetWidth || 200;
      const tooltipHeight = tooltipRef.current.offsetHeight || 40;
      const arrowSizeOffset = 12;

      let side: 'left' | 'right' = 'right';
      let tooltipLeft = clientX + arrowSizeOffset;

      if (tooltipLeft + tooltipWidth > viewportWidth) {
        side = 'left';
        tooltipLeft = clientX - tooltipWidth - arrowSizeOffset;
      }
      if (tooltipLeft < 4) tooltipLeft = 4;

      let tooltipTop = clientY - tooltipHeight / 2;
      tooltipTop = Math.max(6, Math.min(tooltipTop, viewportHeight - tooltipHeight - 6));

      const arrowRelativeY = clientY - tooltipTop;
      const safetyPadding = 8;
      const arrowTop = Math.max(safetyPadding, Math.min(arrowRelativeY, tooltipHeight - safetyPadding));

      setCoords({ tooltipLeft, tooltipTop, arrowTop, side });
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY };
      const target = (e.target as Element).closest('[data-tooltip]');

      if (target) {
        const text = target.getAttribute('data-tooltip') || '';

        if (!text) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);
          activeTargetRef.current = null;
          return;
        }

        if (activeTargetRef.current !== target) {
          activeTargetRef.current = target;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);

          timeoutRef.current = setTimeout(() => {
            if (activeTargetRef.current === target) {
              setContent(text);
              setVisible(true);
              updatePosition(latestMouseRef.current.x, latestMouseRef.current.y);
            }
          }, delay);
        } else if (visible) {
          if (text !== content) setContent(text);
          updatePosition(e.clientX, e.clientY);
        }
      } else {
        if (activeTargetRef.current) {
          activeTargetRef.current = null;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);
        }
      }
    };

    document.body.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.body.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delay, visible, content]);

  if (!content) return null;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "inline-flex z-50 fixed items-center shadow-xl px-2.5 py-1 rounded-md max-w-xs text-[11px] break-words leading-normal pointer-events-none select-none transition-opacity duration-150",
        "bg-slate-900/95 text-slate-100 border border-slate-800/80 backdrop-blur-sm font-sans font-medium",
        "dark:bg-slate-950/95 dark:border-slate-800",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{
        left: `${coords.tooltipLeft}px`,
        top: `${coords.tooltipTop}px`,
      }}
    >
      <span className="block z-10 relative">{content}</span>

      <div
        className={cn(
          "z-0 absolute bg-slate-900 dark:bg-slate-950 border border-transparent size-2",
          coords.side === 'right'
            ? "-left-1 border-l-slate-800/80 border-b-slate-800/80 dark:border-l-slate-800 dark:border-b-slate-800"
            : "-right-1 border-r-slate-800/80 border-t-slate-800/80 dark:border-r-slate-800 dark:border-t-slate-800"
        )}
        style={{
          top: `${coords.arrowTop}px`,
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />
    </div>
  );
}
EOF

# 2. Update AppLayout.tsx to mount <Tooltip delay={300} /> globally
cat << 'EOF' > src/components/app/layout/AppLayout.tsx
import React, { useEffect, useState } from 'react';
import { AppLayoutProps, LayoutContainer } from './types';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ResizableContainer } from '../container/resizable-container';
import { useResizable } from '../container/hooks/use-resizable';
import { AppHeader } from './AppHeader';
import { AppSidebarLeft } from './AppSidebarLeft';
import { AppSidebarRight } from './AppSidebarRight';
import { AppFooter } from './AppFooter';
import { WorkspaceLayout, mergeContainer } from './WorkspaceLayout';
import { ContainerPanelHeader } from './ContainerPanelHeader';
import { Tooltip } from '../tooltip';

export type { AppLayoutProps, MaximizeContainer } from './types';

export function AppLayout({
  layoutContainers,
  activeFeature: activeFeatureProp,
  setActiveFeature: setActiveFeatureProp,
  isDarkMode: isDarkModeProp,
  setIsDarkMode: setIsDarkModeProp,
  notification: notificationProp,
}: AppLayoutProps) {
  const storeContainers = useLayoutStore((s) => s.containers);
  const storeActiveFeature = useAppContextStore((s) => s.activeFeature);
  const setActiveFeatureStore = useAppContextStore((s) => s.setActiveFeature);
  const storeIsDarkMode = useAppContextStore((s) => s.isDarkMode);
  const setIsDarkModeStore = useAppContextStore((s) => s.setIsDarkMode);
  const storeNotification = useAppContextStore((s) => s.notification);

  const activeFeature = activeFeatureProp ?? storeActiveFeature;
  const setActiveFeature = setActiveFeatureProp ?? setActiveFeatureStore;
  const isDarkMode = isDarkModeProp ?? storeIsDarkMode;
  const setIsDarkMode = setIsDarkModeProp ?? setIsDarkModeStore;
  const notification = notificationProp ?? storeNotification;

  const headerConfig = mergeContainer(storeContainers.header, layoutContainers?.header);
  const sidebarLeftConfig = mergeContainer(storeContainers.sidebarLeft, layoutContainers?.sidebarLeft);
  const workspaceConfig = {
    top: mergeContainer(storeContainers.workspace?.top, layoutContainers?.workspace?.top),
    left: mergeContainer(storeContainers.workspace?.left, layoutContainers?.workspace?.left),
    center: mergeContainer(storeContainers.workspace?.center, layoutContainers?.workspace?.center),
    right: mergeContainer(storeContainers.workspace?.right, layoutContainers?.workspace?.right),
    bottom: mergeContainer(storeContainers.workspace?.bottom, layoutContainers?.workspace?.bottom),
  };
  const sidebarRightConfig = mergeContainer(storeContainers.sidebarRight, layoutContainers?.sidebarRight);
  const footerConfig = mergeContainer(storeContainers.footer, layoutContainers?.footer);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
  }, [isDarkMode]);

  const [sidebarLeftMode, setSidebarLeftMode] = useState<'normal' | 'minimal'>('normal');
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(220, 160, 450, true, false);
  const [sidebarRightWidth, startSidebarRightResize] = useResizable(260, 180, 500, true, true);

  const effectiveSidebarLeftWidth = sidebarLeftMode === 'minimal' ? 56 : sidebarLeftWidth;

  const isMainScopeMaximized = (c?: LayoutContainer) =>
    Boolean(
      c?.visible !== false &&
      c?.maximizeContainer?.isMaximizable !== false &&
      c?.maximizeContainer?.isMaximized &&
      (c?.maximizeContainer?.maximizeScope || 'Main') === 'Main'
    );

  const mainMaximizedTarget =
    isMainScopeMaximized(sidebarLeftConfig) ? { title: 'Sidebar Left', path: 'sidebarLeft', config: sidebarLeftConfig } :
    isMainScopeMaximized(sidebarRightConfig) ? { title: 'Sidebar Right Inspector', path: 'sidebarRight', config: sidebarRightConfig } :
    isMainScopeMaximized(workspaceConfig.top) ? { title: 'Workspace Top Section', path: 'workspace.top', config: workspaceConfig.top } :
    isMainScopeMaximized(workspaceConfig.left) ? { title: 'Workspace Left Panel', path: 'workspace.left', config: workspaceConfig.left } :
    isMainScopeMaximized(workspaceConfig.center) ? { title: 'Workspace Center Panel', path: 'workspace.center', config: workspaceConfig.center } :
    isMainScopeMaximized(workspaceConfig.right) ? { title: 'Workspace Right Panel', path: 'workspace.right', config: workspaceConfig.right } :
    isMainScopeMaximized(workspaceConfig.bottom) ? { title: 'Workspace Bottom Panel', path: 'workspace.bottom', config: workspaceConfig.bottom } :
    null;

  if (mainMaximizedTarget) {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-background text-foreground antialiased font-sans">
        <Tooltip delay={300} />
        {headerConfig?.visible !== false && (
          <div id="app-header-container" className="shrink-0 border-b border-border bg-card">
            {headerConfig?.container || (
              <AppHeader
                activeFeature={activeFeature}
                setActiveFeature={setActiveFeature}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                notification={notification}
              />
            )}
          </div>
        )}

        <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col p-1 bg-background">
          <ContainerPanelHeader
            title={`${mainMaximizedTarget.title} (Maximized - Main Scope)`}
            path={mainMaximizedTarget.path}
            isMaximized={mainMaximizedTarget.config.maximizeContainer?.isMaximized}
            isMaximizable={mainMaximizedTarget.config.maximizeContainer?.isMaximizable}
            isHiddable={mainMaximizedTarget.config.isHiddable}
          />
          <div className="flex-1 w-full h-full min-w-0 min-h-0 overflow-auto">
            {mainMaximizedTarget.config.container || (
              <div className="p-4 font-mono text-xs text-muted-foreground flex items-center justify-center h-full">
                Maximized {mainMaximizedTarget.title} Content
              </div>
            )}
          </div>
        </div>

        {footerConfig?.visible !== false && (
          <div id="app-footer-container" className="shrink-0 border-t border-border bg-card">
            {footerConfig?.container || <AppFooter />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      <Tooltip delay={300} />
      {headerConfig?.visible !== false && (
        <div id="app-header-container" className="shrink-0 border-b border-border bg-card">
          {headerConfig?.container || (
            <AppHeader
              activeFeature={activeFeature}
              setActiveFeature={setActiveFeature}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              notification={notification}
            />
          )}
        </div>
      )}

      <div className="flex flex-1 w-full min-h-0 overflow-hidden">
        {sidebarLeftConfig?.visible !== false && (
          <ResizableContainer
            id="app-sidebar-left"
            visible
            resizeHandle={
              sidebarLeftConfig?.isResizable !== false && sidebarLeftMode === 'normal'
                ? 'right'
                : 'none'
            }
            onResizeStart={startSidebarLeftResize}
            style={{ width: `${effectiveSidebarLeftWidth}px` }}
            className="border-r border-border transition-[width] duration-200"
          >
            {sidebarLeftConfig?.container || (
              <AppSidebarLeft
                activeFeature={activeFeature}
                setActiveFeature={setActiveFeature}
                sidebarLeftMode={sidebarLeftMode}
                setSidebarLeftMode={setSidebarLeftMode}
                sidebarLeftWidth={sidebarLeftWidth}
              />
            )}
          </ResizableContainer>
        )}

        <WorkspaceLayout containers={workspaceConfig} />

        {sidebarRightConfig?.visible !== false && (
          <ResizableContainer
            id="app-sidebar-right"
            visible
            resizeHandle={sidebarRightConfig?.isResizable !== false ? 'left' : 'none'}
            onResizeStart={startSidebarRightResize}
            style={{ width: `${sidebarRightWidth}px` }}
            className="border-l border-border"
          >
            {sidebarRightConfig?.container || <AppSidebarRight />}
          </ResizableContainer>
        )}
      </div>

      {footerConfig?.visible !== false && (
        <div id="app-footer-container" className="shrink-0 border-t border-border bg-card">
          {footerConfig?.container || <AppFooter />}
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ fix: Initialized Tooltip globally in AppLayout.tsx with 300ms delay for all data-tooltip elements!"
echo "💡 To test and compile: cd sandbox && npm run compile"
