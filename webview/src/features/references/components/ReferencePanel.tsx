import React, { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ProjectReferencesPanel } from '@/components/app/project-references';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { ReferencesSearch } from '@/router';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

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

  // Handler triggered by table row action button or programmatic triggers
  const handleOpenTransformer = (refInfo?: { fileName?: string; filePath?: string; language?: string } | ReferenceItem | string) => {
    let fileName = 'project-reference-schema.json';
    let filePath = 'src/references/project-reference-schema.json';
    let language = 'json';

    if (typeof refInfo === 'string') {
      fileName = refInfo;
      filePath = `src/references/${fileName}`;
    } else if (refInfo && 'name' in refInfo) {
      fileName = refInfo.name;
      filePath = refInfo.url || `src/references/${refInfo.name}`;
    } else if (refInfo && typeof refInfo === 'object') {
      fileName = refInfo.fileName || fileName;
      filePath = refInfo.filePath || filePath;
      language = refInfo.language || language;
    }

    navigate({
      to: '/transformer',
      search: {
        scope: 'Reference file',
        fileName,
        filePath,
        language,
        fromFeature: 'feature-references',
      },
    });
  };

  return (
    <div className="flex flex-col bg-background p-3 w-full h-full min-h-0 overflow-y-auto font-mono text-xs space-y-3">
      {/* Notification banner on returning from Transformer */}
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

      {/* Hero Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-indigo-500/10 via-primary/5 to-background p-3.5 border border-indigo-500/20 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground text-sm uppercase">
            <Sparkles size={15} className="text-primary" />
            <span>Project References Manager</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Explore reference specifications or click the magic wand icon in any row to transform a reference file.
          </p>
        </div>
      </div>

      <ProjectReferencesPanel
        localDocumentStorage="global-project-references"
        viewMode="Administrator"
        collapsibleParentIncluded={false}
        onTransformReference={handleOpenTransformer}
      />
    </div>
  );
}

export default ReferencePanel;
