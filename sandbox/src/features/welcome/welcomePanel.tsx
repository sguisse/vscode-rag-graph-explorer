import React from 'react';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Sparkles,
  Compass,
  FolderTree,
  Scale,
  FileJson,
  Terminal,
  History,
  Settings,
  HelpCircle,
  ArrowRight,
  Globe,
  Layers,
  Cpu,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Activity,
  Sliders,
  Code2,
} from 'lucide-react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';

export function WelcomePanel() {
  const { setActiveFeature, isDarkMode, toggleThemeMode } = useAppContextStore();
  const { setContainerVisible } = useLayoutStore();

  const primaryFeatures = [
    {
      id: 'feature-explorer',
      title: 'AST Codebase Explorer',
      badge: 'Core Feature',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      icon: FolderTree,
      iconBg: 'bg-primary/10 text-primary',
      description:
        'Interactive Cytoscape topological graph visualizer for multi-language projects. Supports transitive impact propagation analysis and PlantUML diagram generation.',
      details: ['Cytoscape Topological Engine', 'Transitive Impact BFS Analysis', 'Real-time AST Schema Inspector'],
      buttonText: 'Launch AST Explorer',
    },
    {
      id: 'layout-demo',
      title: 'Layout Store Management',
      badge: 'Interactive Demo',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: Layers,
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      description:
        'Demonstrates the modular Zustand layout architecture with dynamic container visibility, resizable splits, and multi-scope maximization (Workspace vs Main).',
      details: ['Multi-Scope Container Maximization', 'Dynamic Content Injection', 'Reactive Panel Version Switcher'],
      buttonText: 'Open Layout Demo',
    },
    {
      id: 'feature-rules',
      title: 'Cypher Architectural Rules',
      badge: 'Governance',
      badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      icon: Scale,
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      description:
        'Define, enforce, and audit graph-based linting policies to prevent architectural anti-patterns, cyclic dependencies, and layer bypasses.',
      details: ['Graph Boundary Verification', 'Cyclic Dependency Detection', 'Custom Impact Metric Policies'],
      buttonText: 'View Impact Rules',
    },
    {
      id: 'panel-prompt',
      title: 'GraphRAG Prompt Studio',
      badge: 'AI Assistant',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: FileJson,
      iconBg: 'bg-amber-500/10 text-amber-500',
      description:
        'Extract high-context codebase subgraphs and format tailored prompts for LLM code reasoning, refactoring recipes, and documentation generation.',
      details: ['Sub-graph Context Extraction', 'LLM Recipe Sheet Generation', 'Structured JSON Schema Export'],
      buttonText: 'Build RAG Context',
    },
  ];

  const secondaryUtilities = [
    {
      id: 'panel-terminal',
      title: 'CLI Console',
      icon: Terminal,
      desc: 'Real-time compilation logs, command execution outputs, and telemetry logs.',
    },
    {
      id: 'panel-history',
      title: 'Session Snapshots',
      icon: History,
      desc: 'Track historical AST import states, exported schemas, and previous impact runs.',
    },
    {
      id: 'panel-configuration',
      title: 'System Preferences',
      icon: Settings,
      desc: 'Configure global workspace settings, default layout bounds, and display themes.',
    },
    {
      id: 'feature-help',
      title: 'Documentation',
      icon: HelpCircle,
      desc: 'Complete guide on graph navigation algorithms, shortcuts, and SOLID design rules.',
    },
  ];

  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden font-sans text-foreground">
      <ContainerPanelHeader title="Welcome & Feature Catalog" path="workspace.center" isHiddable={false} />

      <div className="flex-1 space-y-8 p-6 md:p-8 min-h-0 overflow-y-auto">
        {/* Hero Section Banner */}
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-sm p-8 border border-primary/20 rounded-2xl overflow-hidden">
          <div className="z-10 relative space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 border border-primary/20 rounded-full font-mono font-semibold text-primary text-xs">
              <Sparkles size={14} className="animate-pulse" />
              <span>LLM Prompt and Context Studio • Enterprise AI Tokens optimisation Suite</span>
            </div>

            <h1 className="font-extrabold text-foreground text-3xl sm:text-4xl tracking-tight">
              Simplify Codebase Analysis to build <br/>
              AI Prompt and Context
            </h1>

            <p className="text-muted-foreground text-sm leading-relaxed">
              An enterprise-grade platform engineered with <strong>SOLID design principles</strong>, decoupled Zustand layout states, and Cytoscape topological graph analytics.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="sm"
                className="gap-2 shadow-sm font-mono font-semibold text-xs cursor-pointer"
                onClick={() => setActiveFeature('feature-explorer')}
              >
                <FolderTree size={15} />
                Launch AST Explorer
                <ArrowRight size={14} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-mono font-semibold text-xs cursor-pointer"
                onClick={() => setActiveFeature('layout-demo')}
              >
                <Compass size={15} />
                Try Layout Demo
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-mono font-semibold text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                onClick={() => setContainerVisible('sidebarRight', true)}
              >
                <Sliders size={15} />
                Toggle Inspector Sidebar
              </Button>
            </div>
          </div>

          <div className="-right-10 -bottom-10 absolute opacity-10 pointer-events-none select-none">
            <Globe size={280} className="text-primary" />
          </div>
        </div>

        {/* Primary Features Showcase */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-border border-b">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight">
                <Zap className="text-primary" size={18} /> Core Application Modules
              </h2>
              <p className="text-muted-foreground text-xs">Select a feature module to activate its custom container layout.</p>
            </div>
            <span className="bg-muted/50 px-2.5 py-1 border border-border rounded font-mono text-muted-foreground text-xs">
              4 Primary Feature Layouts
            </span>
          </div>

          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {primaryFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={feat.id}
                  className="flex flex-col justify-between bg-card shadow-xs p-0 border-border hover:border-primary/40 transition-all duration-200"
                >
                  <CardHeader className="space-y-1 p-2 pb-2">
                    <div className="flex justify-between items-center">
                      <div className={`p-2 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${feat.badgeColor}`}>
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <CardTitle className="font-bold text-foreground text-base">{feat.title}</CardTitle>
                      <CardDescription className="mt-1 text-muted-foreground text-xs leading-relaxed">
                        {feat.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5 pt-0">
                    <div className="space-y-1.5 bg-muted/30 p-3 border border-border/60 rounded-lg font-mono text-[11px] text-muted-foreground">
                      {feat.details.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-end mt-auto p-0 pt-0 border-border/40 border-t">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 hover:bg-primary w-full sm:w-auto font-mono font-bold hover:text-primary-foreground text-xs transition-colors cursor-pointer"
                      onClick={() => setActiveFeature(feat.id)}
                    >
                      <span>{feat.buttonText}</span>
                      <ArrowRight size={13} />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Secondary Utilities & Services */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center pb-3 border-border border-b">
            <h3 className="flex items-center gap-2 font-mono font-bold text-foreground text-sm uppercase tracking-tight">
              <Workflow className="text-primary" size={16} /> Supporting Workspace Utilities
            </h3>
          </div>

          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {secondaryUtilities.map((util) => {
              const Icon = util.icon;
              return (
                <div
                  key={util.id}
                  onClick={() => setActiveFeature(util.id)}
                  className="space-y-2 bg-card hover:bg-muted/30 p-4 border border-border hover:border-primary/40 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <span className="font-mono font-bold text-foreground text-xs truncate">{util.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">{util.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Architecture Highlights */}
        <Card className="bg-muted/20 border-border">
          <CardHeader className="bg-muted/40 p-4 border-border border-b">
            <CardTitle className="flex items-center gap-2 font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              <ShieldCheck size={14} className="text-primary" /> Enterprise Architecture Guardrails
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4 grid grid-cols-1 sm:grid-cols-3 p-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Code2 size={13} className="text-primary" /> Single Responsibility
              </span>
              <p className="text-[11px] text-muted-foreground">
                Container resizing, panel headers, and feature state are fully decoupled into dedicated modules.
              </p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Activity size={13} className="text-emerald-500" /> Multi-Scope Maximization
              </span>
              <p className="text-[11px] text-muted-foreground">
                Containers expand across either <strong>Workspace</strong> bounds or full <strong>Main</strong> screen area.
              </p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Cpu size={13} className="text-indigo-500" /> Reactive Layout Store
              </span>
              <p className="text-[11px] text-muted-foreground">
                Zustand layout state coordinates visibility flags and JSX container injections reactively.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Standard Enterprise Footer */}
        <div className="flex sm:flex-row flex-col justify-between items-center gap-2 pt-4 border-border border-t font-mono text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> System Online
            </span>
            <span>•</span>
            <span>Graph Engine: Cytoscape v3.34</span>
            <span>•</span>
            <span>Store: Zustand v5</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleThemeMode}
              className="font-mono hover:text-foreground text-xs underline cursor-pointer"
            >
              Theme: {isDarkMode ? 'Dark' : 'Light'} Mode
            </button>
            <span>•</span>
            <span>v2.0.0-release</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePanel;
