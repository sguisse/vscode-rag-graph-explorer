import React, { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ProjectReferencesPanel } from '@/components/app/project-references';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';
import { ReferencesSearch } from '@/router';

export function ReferencePanel() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as ReferencesSearch;

  const [lastUpdatedInfo, setLastUpdatedInfo] = useState<{
    time: string;
    file?: string;
    action?: string;
  } | null>(null);

  useEffect(() => {
    if (search?.updatedAt) {
      setLastUpdatedInfo({
        time: new Date(search.updatedAt).toLocaleTimeString(),
        file: search.updatedFile,
        action: search.sourceAction || 'Transformed & Validated',
      });
    }
  }, [search?.updatedAt, search?.updatedFile, search?.sourceAction]);

  const handleOpenTransformer = (fileName = 'project-reference-schema.json') => {
    navigate({
      to: '/transformer',
      search: {
        scope: 'Reference file',
        fileName,
        filePath: `src/references/${fileName}`,
        language: 'json',
      },
    });
  };

  return (
    <div className="flex flex-col bg-background p-3 w-full h-full min-h-0 overflow-y-auto font-mono text-xs space-y-3">
      {lastUpdatedInfo && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-emerald-500 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <div>
              <span className="font-bold">Screen Updated from Transformer: </span>
              <span>{lastUpdatedInfo.action} [{lastUpdatedInfo.file || 'Reference File'}] at {lastUpdatedInfo.time}</span>
            </div>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setLastUpdatedInfo(null)}
            className="h-5 text-[10px] text-emerald-500 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-indigo-500/10 via-primary/5 to-background p-3.5 border border-indigo-500/20 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground text-sm uppercase">
            <Sparkles size={15} className="text-primary" />
            <span>Project References Manager</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Explore reference specifications or transform reference files using the pipeline engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => handleOpenTransformer('global-references.json')}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs cursor-pointer"
          >
            <FileCode size={13} />
            <span>Transform Linked Reference</span>
            <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      <ProjectReferencesPanel
        localDocumentStorage="global-project-references"
        viewMode="Administrator"
        collapsibleParentIncluded={false}
      />
    </div>
  );
}

export default ReferencePanel;
