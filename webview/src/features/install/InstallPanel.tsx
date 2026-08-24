import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Coffee,
  Code2,
  Box,
  Terminal,
  Activity,
  RefreshCw,
  Search,
  Layers
} from 'lucide-react';
import { useAppContextStore } from '@/store/useAppContextStore';

// ============================================================================
// DESIGN SYSTEM: Layout & Grid Configuration
// ============================================================================
const CARDS_PER_ROW = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  wide: 'xl:grid-cols-5', // Control tower density (4 cards per row)
} as const;

const CARDS_GRID_LAYOUT = `${CARDS_PER_ROW.mobile} ${CARDS_PER_ROW.tablet} ${CARDS_PER_ROW.desktop} ${CARDS_PER_ROW.wide}`;

// ============================================================================
// DESIGN SYSTEM: Text Size Constants
// ============================================================================
const TEXT_SIZES = {
  // Hero Header Banner
  heroBadge: 'text-xs',
  heroTitle: 'text-xl sm:text-2xl',
  heroDescription: 'text-xs',
  heroStatLabel: 'text-[10px]',
  heroStatValue: 'text-sm',
  heroButton: 'text-xs',

  // Control & Filter Bar
  sectionTitle: 'text-sm',
  countBadge: 'text-[11px]',
  searchInput: 'text-xs',
  filterButton: 'text-xs',

  // Card Header
  cardTitle: 'text-xs',
  cardSubText: 'text-[10px]',
  cardBadge: 'text-[10px]',

  // Card Step Items
  stepTitle: 'text-[12px]',
  stepBadge: 'text-[10px]',
  stepMessage: 'text-[11px]',
  stepCode: 'text-[10.5px]',
} as const;

// Raw status payload from finalstatus.json
const rawStatusData = {
  "node_dependency_cruiser": { "node": { "status": "✅" }, "dependency_cruiser": { "status": "✅" }, "summary": { "globalStatus": "✅", "stepsCount": "2", "koCount": 0, "okCount": 2 } },
  "java_jqassistant_graph_rag": { "git_lfs_availability": { "status": "✅", "path": "/opt/homebrew/bin/git-lfs" }, "jqassistant_graph_rag_tool": { "status": "✅" }, "jqassistant_graph_rag_llm_model": { "status": "✅" }, "mcp_server_config": { "status": "✅" }, "mcp_server_up": { "status": "✅" }, "summary": { "globalStatus": "✅", "stepsCount": "5", "koCount": 0, "okCount": 5 } },
  "01_system_core": { "python3_prerequisite": { "status": "✅", "version": "Python 3.14.6", "path": "/opt/homebrew/bin/python3", "message": "Detected python3 (Python 3.14.6)" }, "pip_prerequisite": { "status": "✅", "version": "pip 26.1.2 from /opt/homebrew/lib/python3.14/site-packages/pip (python 3.14)", "path": "/opt/homebrew/bin/pip3", "message": "Detected pip3 (pip 26.1.2 from /opt/homebrew/lib/python3.14/site-packages/pip (python 3.14))" }, "node_prerequisite": { "status": "✅", "version": "v26.3.1", "path": "/opt/homebrew/bin/node", "message": "Detected node (v26.3.1)" }, "npm_prerequisite": { "status": "✅", "version": "11.16.0", "path": "/opt/homebrew/bin/npm", "message": "Detected npm (11.16.0)" }, "java_prerequisite": { "status": "✅", "version": "openjdk version \"25.0.1\" 2025-10-21", "path": "/usr/bin/java", "message": "Detected java (openjdk version \"25.0.1\" 2025-10-21)" }, "gitignore_rule_mapped": { "status": "✅" }, "summary": { "globalStatus": "✅", "stepsCount": "6", "koCount": 0, "okCount": 6 } },
  "java_jacoco": { "jacoco_wired": { "status": "✅", "path": "./target/site/jacoco/jacoco.xml" }, "summary": { "globalStatus": "✅", "stepsCount": "1", "koCount": 0, "okCount": 1 } },
  "01_system_neo4j": { "java_runtime_executable": { "status": "❌", "message": "Active Java runtime environment is missing, non-compliant, or untracked." }, "neo4j_local_installation": { "status": "✅", "location": "/Users/mac-SGUISS21/90-temp/smart-supply-back/.token-razor/target/graph_rag_explorer/tools/system/neo4j/neo4j-community-5.26.0" }, "neo4j_plugins_compliance": { "status": "✅", "message": "APOC Core, GDS extensions, and service.py controller detected inside sandbox context." }, "neo4j_db_running": { "status": "✅", "message": "Neo4j database is running and reachable on Bolt port 7687." }, "remote_database_token": { "status": "✅", "message": "Remote-Database identifier token confirmed active." }, "summary": { "globalStatus": "❌", "stepsCount": "5", "koCount": 1, "okCount": 4 } },
  "node_swc": { "node": { "status": "✅" }, "npm": { "status": "✅" }, "swc": { "status": "✅" }, "summary": { "globalStatus": "✅", "stepsCount": "3", "koCount": 0, "okCount": 3 } },
  "python_graphify": { "uvx": { "status": "✅" }, "summary": { "globalStatus": "✅", "stepsCount": "1", "koCount": 0, "okCount": 1 } },
  "java_jqassistant": { "java": { "status": "✅" }, "jqassistant_binary": { "status": "✅" }, "raw_outputs_java": { "status": "❌", "message": "Java analysis target subdirectory raw outputs path layout is missing." }, "jqassistant_custom_config": { "status": "✅" }, "jqassistant_custom_rules": { "status": "✅" }, "remote_database_token": { "status": "✅" }, "summary": { "globalStatus": "❌", "stepsCount": "6", "koCount": 1, "okCount": 5 } },
  "summary": { "globalStatus": "⚠️", "stepsCount": "29", "koCount": 2, "okCount": 27 }
};

const getStatusColors = (status: string) => {
  switch (status) {
    case '✅':
      return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
    case '❌':
      return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40', badgeBg: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle };
    case '⚠️':
      return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40', badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle };
    default:
      return { text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', badgeBg: 'bg-muted text-muted-foreground border-border', icon: Activity };
  }
};

const getModuleMetadata = (key: string) => {
  if (key.includes('core')) return { icon: Server, name: 'System Core' };
  if (key.includes('neo4j')) return { icon: Database, name: 'Neo4j Database' };
  if (key.includes('graph_rag')) return { icon: Layers, name: 'Java Graph RAG' };
  if (key.includes('jqassistant')) return { icon: Coffee, name: key.replace(/_/g, ' ').replace('01', '').trim() };
  if (key.includes('python')) return { icon: Code2, name: 'Python Graphify' };
  if (key.includes('cruiser') || key.includes('swc')) return { icon: Box, name: key.replace(/_/g, ' ').trim() };
  return { icon: Terminal, name: key.replace(/_/g, ' ') };
};

export function InstallPanel() {
  const [filter, setFilter] = useState<'ALL' | 'ERRORS' | 'CORE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const globalSummary = rawStatusData.summary;
  const globalStatusStyle = getStatusColors(globalSummary.globalStatus);
  const GlobalIcon = globalStatusStyle.icon;

  const modules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return Object.entries(rawStatusData)
      .filter(([key]) => key !== 'summary')
      .map(([key, data]: [string, any]) => ({
        id: key,
        ...getModuleMetadata(key),
        ...data
      }))
      .filter((mod) => {
        if (filter === 'ERRORS') return mod.summary.koCount > 0;
        if (filter === 'CORE') return mod.id.startsWith('01_');
        return true;
      })
      .filter((mod) => {
        if (!q) return true;

        // Search module name & ID
        const modMatch = mod.name.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
        if (modMatch) return true;

        // Search individual step checks
        const stepEntries = Object.entries(mod).filter(
          ([k]) => !['summary', 'id', 'name', 'icon'].includes(k)
        );

        return stepEntries.some(([stepKey, stepData]: [string, any]) => {
          const checkNameMatch = stepKey.toLowerCase().includes(q);
          const messageMatch = stepData?.message?.toLowerCase().includes(q);
          const pathMatch = (stepData?.path || stepData?.location || stepData?.version)?.toLowerCase().includes(q);
          return checkNameMatch || messageMatch || pathMatch;
        });
      })
      .sort((a, b) => {
        // STRICT RULE 1: System Core ALWAYS at position #1
        if (a.id === '01_system_core') return -1;
        if (b.id === '01_system_core') return 1;

        // RULE 2: Keep other system-level modules (e.g. Neo4j) near top
        if (a.id.startsWith('01_') && !b.id.startsWith('01_')) return -1;
        if (!a.id.startsWith('01_') && b.id.startsWith('01_')) return 1;

        // RULE 3: Order remaining modules by error count descending
        return b.summary.koCount - a.summary.koCount;
      });
  }, [filter, searchQuery]);

  return (
    <div className="flex-1 space-y-4 bg-background p-3 md:p-4 min-h-0 overflow-y-auto text-foreground">

      {/* 1. HERO BANNER */}
      <div className={`relative bg-gradient-to-br from-primary/10 via-background to-${globalStatusStyle.text.split('-')[1]}-500/10 shadow-sm p-4 md:p-5 border ${globalStatusStyle.border} rounded-xl overflow-hidden`}>
        <div className="z-10 relative flex md:flex-row flex-col justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full font-mono font-semibold ${TEXT_SIZES.heroBadge} ${globalStatusStyle.badgeBg}`}>
              <GlobalIcon size={14} className={globalSummary.globalStatus === '⚠️' ? 'animate-pulse' : ''} />
              <span>Environment Diagnostic Status</span>
            </div>

            <h1 className={`font-extrabold text-foreground ${TEXT_SIZES.heroTitle} leading-tight tracking-tight`}>
              Installation & <span className="bg-clip-text bg-gradient-to-r from-emerald-400 via-primary to-amber-400 text-transparent">Health Check</span>
            </h1>

            <p className={`text-muted-foreground ${TEXT_SIZES.heroDescription} leading-relaxed`}>
              {globalSummary.koCount > 0
                ? "Attention required: Validation failed on specific components. Check the highlighted steps below."
                : "All system prerequisites and graph engine dependencies are operational and fully configured."}
            </p>
          </div>

          {/* Telemetry Summary */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
             <div className="flex items-center gap-4 bg-card/70 shadow-xs backdrop-blur-md px-3 py-2 border border-border/70 rounded-lg">
                <div className="flex flex-col items-center text-center">
                    <span className={`text-muted-foreground block ${TEXT_SIZES.heroStatLabel} uppercase font-mono`}>Total</span>
                    <span className={`font-mono font-bold ${TEXT_SIZES.heroStatValue}`}>{globalSummary.stepsCount}</span>
                </div>
                <div className="bg-border/60 w-px h-6" />
                <div className="flex flex-col items-center text-center">
                    <span className={`text-emerald-500 block ${TEXT_SIZES.heroStatLabel} uppercase font-mono font-semibold`}>Passed</span>
                    <span className={`font-mono font-bold text-emerald-500 ${TEXT_SIZES.heroStatValue}`}>{globalSummary.okCount}</span>
                </div>
                {globalSummary.koCount > 0 && (
                    <>
                    <div className="bg-border/60 w-px h-6" />
                    <div className="flex flex-col items-center text-center">
                        <span className={`text-red-500 block ${TEXT_SIZES.heroStatLabel} uppercase font-mono font-semibold`}>Errors</span>
                        <span className={`font-mono font-bold text-red-500 ${TEXT_SIZES.heroStatValue}`}>{globalSummary.koCount}</span>
                    </div>
                    </>
                )}
            </div>


             <Button size="sm" className={`gap-1.5 font-semibold shadow-xs cursor-pointer ${TEXT_SIZES.heroButton} h-9`}>
               <RefreshCw size={14} /> Re-run
             </Button>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="flex sm:flex-row flex-col justify-between items-stretch sm:items-center gap-2.5 bg-card/60 shadow-xs p-2.5 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <h2 className={`flex items-center gap-1.5 font-bold text-foreground ${TEXT_SIZES.sectionTitle} tracking-tight`}>
            <Activity className="text-primary" size={16} /> Component Telemetry
          </h2>
          <span className={`font-mono bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold ${TEXT_SIZES.countBadge}`}>
            {modules.length} {modules.length === 1 ? 'module' : 'modules'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deep Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="top-2 left-2.5 absolute text-muted-foreground" />
            <input
              type="text"
              placeholder="Search components or check names (e.g. node, java)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-background border border-border rounded-md pl-8 pr-2.5 py-1 ${TEXT_SIZES.searchInput} font-mono focus:outline-none focus:ring-1 focus:ring-primary`}
            />
          </div>

          {/* Filter Buttons */}
          <div className={`flex bg-muted/60 p-0.5 rounded border border-border/60 ${TEXT_SIZES.filterButton} font-medium`}>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'ALL' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ERRORS')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'ERRORS' ? 'bg-red-500 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Errors ({globalSummary.koCount})
            </button>
            <button
              onClick={() => setFilter('CORE')}
              className={`px-2.5 py-0.5 rounded-sm transition-all ${filter === 'CORE' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Core
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONDENSED CARDS GRID (Configurable Cards Per Row) */}
      <div className={`gap-3 grid ${CARDS_GRID_LAYOUT}`}>
        {modules.map((module) => {
          const ModIcon = module.icon;
          const isError = module.summary.koCount > 0;
          const modStyle = getStatusColors(module.summary.globalStatus);

          return (
            <Card
              key={module.id}
              className={`flex flex-col bg-card shadow-xs transition-all duration-200 border-l-4 ${
                isError
                  ? 'border-l-red-500 border-red-500/30 bg-red-500/[0.02]'
                  : 'border-l-emerald-500 hover:border-primary/40'
              }`}
            >
              {/* Card Header */}
              <CardHeader className="space-y-0 p-2.5 pb-2 border-border/50 border-b">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`p-1.5 rounded-md shrink-0 ${modStyle.bg} ${modStyle.text}`}>
                      <ModIcon size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <CardTitle className={`font-bold text-foreground ${TEXT_SIZES.cardTitle} uppercase tracking-wider truncate`}>
                        {module.name}
                      </CardTitle>
                      <div className={`text-muted-foreground font-mono ${TEXT_SIZES.cardSubText}`}>
                        {module.summary.okCount}/{module.summary.stepsCount} passed
                      </div>
                    </div>
                  </div>

                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${TEXT_SIZES.cardBadge} ${modStyle.badgeBg}`}>
                    {module.summary.globalStatus === '✅' ? 'OK' : 'FAIL'}
                  </span>
                </div>
              </CardHeader>

              {/* Step Items List */}
              <CardContent className="flex-1 space-y-1.5 p-2">
                {Object.entries(module).map(([stepKey, stepData]: [string, any]) => {
                  if (['summary', 'id', 'name', 'icon'].includes(stepKey)) return null;

                  const stepStyle = getStatusColors(stepData.status);
                  const StepIcon = stepStyle.icon;

                  return (
                    <div
                      key={stepKey}
                      className={`p-2 rounded border transition-colors ${
                        stepData.status === '❌'
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : 'bg-muted/20 border-border/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-1.5">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <StepIcon size={14} className={`shrink-0 ${stepStyle.text}`} />
                          <span className={`font-semibold ${TEXT_SIZES.stepTitle} text-foreground capitalize truncate`}>
                            {stepKey.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className={`font-mono font-bold px-1 py-0.2 rounded uppercase shrink-0 ${TEXT_SIZES.stepBadge} ${
                          stepData.status === '✅' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500 text-white'
                        }`}>
                          {stepData.status === '✅' ? 'OK' : 'FAIL'}
                        </span>
                      </div>

                      {/* Display Messages / Versions */}
                      {(stepData.message || stepData.version) && (
                        <p className={`mt-1 leading-tight ${TEXT_SIZES.stepMessage} ${stepData.status === '❌' ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                          {stepData.message || stepData.version}
                        </p>
                      )}

                      {/* Display File Paths */}
                      {(stepData.path || stepData.location) && (
                        <div className="bg-background/60 mt-1 px-1.5 py-0.5 border border-border/50 rounded overflow-x-auto">
                          <code className={`${TEXT_SIZES.stepCode} text-muted-foreground font-mono block truncate`}>
                            {stepData.path || stepData.location}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

export default InstallPanel;
