#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/features/home/data
mkdir -p webview/src/features/home/model
mkdir -p webview/src/features/home/components

# Clean up temporary placement from previous step if present
rm -rf webview/src/features/home/model/*.yaml

# ------------------------------------------------------------------------------
# 1. Create primary-features.yaml in webview/src/features/home/data
# ------------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/home/data/primary-features.yaml
- id: feature-graph-explorer
  title: Semantic Context Graph
  badge: "Step 1 : Map"
  badgeColor: bg-blue-500/10 text-blue-500 border-blue-500/20
  icon: FolderTree
  iconBg: bg-blue-500/10 text-blue-500
  description: >-
    Visualize your codebase dependencies. Select a target file and let the engine automatically fetch upstream callers and downstream services.
  details:
    - Neo4j Relationship Mapping
    - Upstream/Downstream Auto-selection
    - Cross-language Support
  buttonText: Open Graph Explorer

- id: feature-skeleton
  title: Smart Skeletonization
  badge: "Step 2 : Optimize"
  badgeColor: bg-emerald-500/10 text-emerald-500 border-emerald-500/20
  icon: Scissors
  iconBg: bg-emerald-500/10 text-emerald-500
  description: >-
    Cut the noise. Strip internal implementations from downstream dependencies and keep only interfaces, types, and method signatures.
  details:
    - Tree-sitter AST Parsing
    - -80% Token usage on dependencies
    - Prevents LLM Context Dilution
  buttonText: Configure Minifier

- id: feature-impact
  title: Blast Radius Analysis
  badge: Anti-Hallucination
  badgeColor: bg-indigo-500/10 text-indigo-500 border-indigo-500/20
  icon: Target
  iconBg: bg-indigo-500/10 text-indigo-500
  description: >-
    Ensure the LLM knows what will break. Automatically inject context about architectural rules and tightly coupled components.
  details:
    - Cyclic Dependency Alerts
    - Architectural Boundary checks
    - First-Time-Right Code Gen
  buttonText: View Impact Engine

- id: feat-prompt
  title: XML Prompt Builder
  badge: "Step 3 : Export"
  badgeColor: bg-amber-500/10 text-amber-500 border-amber-500/20
  icon: FileJson
  iconBg: bg-amber-500/10 text-amber-500
  description: >-
    Compile your optimized context into a structured XML format, proven to yield the highest reasoning accuracy from Claude 3.5 & GPT-4o.
  details:
    - Live Token Cost Estimator
    - Structured XML/JSON formats
    - One-click copy to clipboard
  buttonText: Build RAG Context
EOF

# ------------------------------------------------------------------------------
# 2. Create secondary-utilities.yaml in webview/src/features/home/data
# ------------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/home/data/secondary-utilities.yaml
- id: feat-terminal
  title: Token Metrics
  icon: LineChart
  desc: Track your estimated API cost savings and context ratio over time.

- id: feat-history
  title: Prompt History
  icon: History
  desc: Retrieve your previous context snapshots and generated recipes.

- id: feat-configuration
  title: Ignore Rules
  icon: ShieldAlert
  desc: Configure global .ctxignore files to never send sensitive data to LLMs.

- id: feature-help
  title: Documentation
  icon: HelpCircle
  desc: Learn how to master Context Engineering and zero-shot prompting.
EOF

# ------------------------------------------------------------------------------
# 3. Define TS interfaces in webview/src/features/home/model
# ------------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/home/model/primary-feature.model.ts
export interface PrimaryFeatureItem {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: string;
  iconBg: string;
  description: string;
  details: string[];
  buttonText: string;
}
EOF

cat << 'EOF' > webview/src/features/home/model/secondary-utility.model.ts
export interface SecondaryUtilityItem {
  id: string;
  title: string;
  icon: string;
  desc: string;
}
EOF

cat << 'EOF' > webview/src/features/home/model/index.ts
export * from './primary-feature.model';
export * from './secondary-utility.model';
EOF

# ------------------------------------------------------------------------------
# 4. Update HomePanel.tsx to import models from /model and YAML from /data
# ------------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/home/components/HomePanel.tsx
import React, { useEffect, useState } from 'react';
import {
  resolveIconUrlAsync,
  LOGO_LIGHT_PATH,
  LOGO_DARK_PATH,
  LOGO_MAX_LIGHT_PATH,
  LOGO_MAX_DARK_PATH,
} from '@/lib/utils-image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Sparkles,
  FolderTree,
  FileJson,
  Terminal,
  History,
  HelpCircle,
  ArrowRight,
  Zap,
  CheckCircle2,
  Workflow,
  Scissors,
  Target,
  LineChart,
  ShieldAlert,
  Cpu,
  Braces,
  Database,
} from 'lucide-react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { PrimaryFeatureItem, SecondaryUtilityItem } from '../model';
import primaryFeaturesData from '../data/primary-features.yaml';
import secondaryUtilitiesData from '../data/secondary-utilities.yaml';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FolderTree,
  Scissors,
  Target,
  FileJson,
  LineChart,
  History,
  ShieldAlert,
  HelpCircle,
};

const primaryFeatures = primaryFeaturesData as PrimaryFeatureItem[];
const secondaryUtilities = secondaryUtilitiesData as SecondaryUtilityItem[];

export function HomePanel() {
  const { setActiveFeature, isDarkMode, toggleThemeMode } = useAppContextStore();
  const { setContainerVisible } = useLayoutStore();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoMaxUrl, setLogoMaxUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const targetLogo = isDarkMode ? LOGO_DARK_PATH : LOGO_LIGHT_PATH;
    const targetLogoMax = isDarkMode ? LOGO_MAX_DARK_PATH : LOGO_MAX_LIGHT_PATH;

    resolveIconUrlAsync(targetLogo).then((url) => {
      if (isMounted) setLogoUrl(url);
    });

    resolveIconUrlAsync(targetLogoMax).then((url) => {
      if (isMounted) setLogoMaxUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [isDarkMode]);

  return (
    <div className="flex-1 space-y-8 p-3 md:p-3 min-h-0 h-full overflow-y-auto">
      {/* Hero Section Banner with App Logo */}
      <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-sm p-8 border border-primary/20 rounded-2xl overflow-hidden">
        <div className="z-10 relative space-y-5 max-w-2xl">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="App Logo"
                className="drop-shadow-md w-auto h-6 object-contain"
              />
            )}
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 border border-primary/20 rounded-full font-mono font-semibold text-primary text-xs">
              <Sparkles size={14} className="animate-pulse" />
              <span>LeanPrompt • Surgical Context Engineering</span>
            </div>
          </div>

          <h1 className="font-extrabold text-foreground text-3xl sm:text-4xl leading-tight tracking-tight">
            Maximum Context Relevance. <br className="hidden sm:block" />
            <span className="inline-block bg-clip-text bg-gradient-to-r from-emerald-500 via-primary to-blue-500 font-extrabold text-transparent [-webkit-background-clip:text]">
              Minimum Token Usage.
            </span>
          </h1>

          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
            Stop copy-pasting entire folders. Use graph-based dependency analysis and AST skeletonization to feed your LLM exactly what it needs to write perfect code, for a fraction of the cost.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="default"
              className="gap-2 shadow-sm font-semibold cursor-pointer"
              onClick={() => setActiveFeature('feature-graph-explorer')}
            >
              <FolderTree size={16} />
              Start Context Selection
              <ArrowRight size={16} />
            </Button>

            <Button
              variant="outline"
              size="default"
              className="gap-2 font-semibold cursor-pointer"
              onClick={() => setContainerVisible('sidebarRight', true)}
            >
              <Terminal size={16} />
              View Token Savings
            </Button>
          </div>
        </div>

        <div className="-top-0 -right-0 absolute opacity-60 pointer-events-none select-none">
          {logoMaxUrl && (
            <img
              className="w-90 h-90 object-contain"
              src={logoMaxUrl}
              alt="App Logo"
            />
          )}
        </div>
      </div>

      {/* Primary Features Showcase */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-border border-b">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight">
              <Zap className="text-primary" size={18} /> The Context Pipeline
            </h2>
            <p className="text-muted-foreground text-xs">From raw codebase to highly optimized LLM prompt.</p>
          </div>
        </div>

        <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
          {primaryFeatures.map((feat) => {
            const Icon = ICON_MAP[feat.icon] || FolderTree;
            return (
              <Card
                key={feat.id}
                className="flex flex-col justify-between bg-card shadow-xs p-0 border-border hover:border-primary/40 transition-all duration-200"
              >
                <CardHeader className="space-y-1 p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-xl ${feat.iconBg} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>
                  </div>

                  <div className="pt-2">
                    <CardTitle className="font-bold text-foreground text-sm">{feat.title}</CardTitle>
                    <CardDescription className="mt-1 text-muted-foreground text-xs leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 p-4 pt-0">
                  <div className="space-y-1.5 bg-muted/30 p-2.5 border border-border/60 rounded-lg font-mono text-[10px] text-muted-foreground">
                    {feat.details.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end mt-auto p-0 pt-0 border-border/40 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 hover:bg-primary/10 rounded-none rounded-b-xl w-full h-10 font-mono font-bold hover:text-primary text-xs transition-colors cursor-pointer"
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
            <Workflow className="text-primary" size={16} /> Supporting Utilities
          </h3>
        </div>

        <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {secondaryUtilities.map((util) => {
            const Icon = ICON_MAP[util.icon] || HelpCircle;
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
            <Cpu size={14} className="text-primary" /> Core Engine Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4 grid grid-cols-1 sm:grid-cols-3 p-4 font-mono text-xs">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Database size={13} className="text-primary" /> Local Neo4j Graph
            </span>
            <p className="text-[11px] text-muted-foreground">
              Instant topological traversal of your entire workspace without sending code to third parties.
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Braces size={13} className="text-emerald-500" /> Tree-sitter Parsing
            </span>
            <p className="text-[11px] text-muted-foreground">
              Syntax-aware AST parsing to safely extract interfaces and collapse implementations.
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Zap size={13} className="text-amber-500" /> Asynchronous Python Backend
            </span>
            <p className="text-[11px] text-muted-foreground">
              Heavy lifting is offloaded via LSP to ensure VS Code remains perfectly fluid and responsive.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Standard Enterprise Footer */}
      <div className="flex sm:flex-row flex-col justify-between items-center gap-2 pt-4 pb-4 border-border border-t font-mono text-muted-foreground text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" /> Engine Connected
          </span>
          <span>•</span>
          <span>Local Python Backend</span>
          <span>•</span>
          <span>Tiktoken Active</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleThemeMode}
            className="font-mono hover:text-foreground text-xs underline cursor-pointer"
          >
            Theme: {isDarkMode ? 'Dark' : 'Light'} Mode
          </button>
          <span>•</span>
          <span>v0.1.0-beta</span>
        </div>
      </div>
    </div>
  );
}

export default HomePanel;
EOF

echo "✅ refactor: Placed YAML files in webview/src/features/home/data and defined TypeScript interfaces in webview/src/features/home/model!"
