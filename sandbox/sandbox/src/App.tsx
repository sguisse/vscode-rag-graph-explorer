import React from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layout, Eye, Box, SlidersHorizontal, Layers } from 'lucide-react';

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();
  const { setContainerContent, toggleContainerVisible, containers, resetContainers } = useLayoutStore();

  const handleInjectCustomContent = () => {
    setContainerContent(
      'workspace.center',
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-primary/5 border border-primary/20 rounded-lg m-4 font-mono text-xs">
        <Box className="w-10 h-10 mb-2 text-primary animate-bounce" />
        <h3 className="font-bold text-base text-foreground">Dynamic Content Injected via Zustand Hook</h3>
        <p className="text-muted-foreground max-w-md mt-1">
          This content was set dynamically in `useLayoutStore` using `setContainerContent('workspace.center', ...)`.
        </p>
        <Button size="sm" variant="outline" className="mt-4 font-mono text-xs" onClick={() => resetContainers()}>
          Reset Default Layout Content
        </Button>
      </div>
    );
  };

  const layoutControlCenter = (
    <div className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto font-mono text-xs">
      <Card className="max-w-2xl w-full bg-card border-border shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Layout className="text-primary" size={18} /> Layout Management & Zustand State Store Showcase
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            All existing features have been deactivated as requested to concentrate on the <strong>Layout Management Big Bang Refactoring</strong>.
            The architecture now strictly enforces <strong>SOLID Principles</strong>:
          </p>

          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] bg-muted/20 p-3 rounded border border-border">
            <li><strong>Single Responsibility (SRP):</strong> ResizableContainer manages only container resizing & bounds; headers and controls live in dedicated files.</li>
            <li><strong>Open/Closed (OCP):</strong> Layout container tree structured via TypeScript interfaces (WorkspaceContainers, AppLayoutContainers).</li>
            <li><strong>Composition over Inheritance:</strong> LayoutContainer uses composite `maximizeContainer?: MaximizeContainer`.</li>
          </ul>

          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="font-bold text-foreground text-xs uppercase flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-primary" /> Interactive Container Visibility Controls
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('sidebarLeft')}>
                <Eye size={12} className="mr-1" /> Toggle Left Sidebar
              </Button>

              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.top')}>
                <Eye size={12} className="mr-1" /> Toggle Wkp Top
              </Button>

              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.left')}>
                <Eye size={12} className="mr-1" /> Toggle Wkp Left
              </Button>

              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.right')}>
                <Eye size={12} className="mr-1" /> Toggle Wkp Right
              </Button>

              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.bottom')}>
                <Eye size={12} className="mr-1" /> Toggle Wkp Bottom
              </Button>

              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('sidebarRight')}>
                <Eye size={12} className="mr-1" /> Toggle Right Sidebar
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="font-bold text-foreground text-xs uppercase flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> Dynamic Content Injection via Hook
            </h4>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="text-xs font-mono" onClick={handleInjectCustomContent}>
                Inject Custom View into Center
              </Button>
              <Button size="sm" variant="secondary" className="text-xs font-mono" onClick={resetContainers}>
                Reset Layout Containers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppLayout
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      notification={notification}
      layoutContainers={{
        header: { ...containers.header },
        sidebarLeft: { ...containers.sidebarLeft, isResizable: true },
        workspace: {
          top: {
            ...containers.workspace?.top,
            container: containers.workspace?.top?.container || (
              <div className="p-2 font-mono text-xs text-muted-foreground flex justify-between items-center bg-muted/20 h-full">
                <span>Workspace Top Section</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Active</span>
              </div>
            ),
          },
          left: {
            ...containers.workspace?.left,
            maximizeContainer: {
              ...containers.workspace?.left?.maximizeContainer,
              maximizeScope: 'Workspace',
            },
            container: containers.workspace?.left?.container || (
              <div className="p-3 font-mono text-xs text-muted-foreground bg-muted/10 h-full">Workspace Left Panel</div>
            ),
          },
          center: {
            ...containers.workspace?.center,
            visible: true,
            container: containers.workspace?.center?.container || layoutControlCenter,
          },
          right: {
            ...containers.workspace?.right,
            container: containers.workspace?.right?.container || (
              <div className="p-3 font-mono text-xs text-muted-foreground bg-muted/10 h-full">Workspace Right Panel</div>
            ),
          },
          bottom: {
            ...containers.workspace?.bottom,
            container: containers.workspace?.bottom?.container || (
              <div className="p-2 font-mono text-xs text-muted-foreground flex justify-between items-center bg-muted/20 h-full">
                <span>Workspace Bottom Log Output</span>
                <span className="text-[10px] text-muted-foreground">Status: Ready</span>
              </div>
            ),
          },
        },
        sidebarRight: { ...containers.sidebarRight, isResizable: true },
        footer: { ...containers.footer },
      }}
    />
  );
}
