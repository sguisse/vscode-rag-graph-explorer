import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, FileText } from 'lucide-react';
import { resolveIconUrlAsync } from '@/lib/utils-image';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { useExporterStore } from '../store/useExporterStore';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import {
  formatPredefinedPromptText,
  PREDEFINED_PROMPTS_LIST,
  PredefinedPromptItem,
} from './tabs/prompt/data/predefined-prompts';
import { FilesExporterResult } from '@/shared/services/file-exporter/model/file-exporter-model';

export interface ExchangeLink {
  icon?: string;
  tooltip?: string;
  url: string;
}

interface ExternalLinksProps {
  exchangeLinks?: ExchangeLink[];
  onOpenExchangeUrl?: (url: string, inBrowserTab?: boolean) => void;
}

export const ExternalLinks: React.FC<ExternalLinksProps> = ({
  exchangeLinks = [],
  onOpenExchangeUrl,
}) => {
  const [resolvedIconUrls, setResolvedIconUrls] = useState<Record<number, string>>({});
  const [failedIcons, setFailedIcons] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    exchangeLinks.forEach((link, idx) => {
      if (link.icon) {
        resolveIconUrlAsync(link.icon)
          .then((url) => {
            if (isMounted && url) {
              setResolvedIconUrls((prev) => ({ ...prev, [idx]: url }));
            }
          })
          .catch(() => {
            if (isMounted) {
              setFailedIcons((prev) => ({ ...prev, [idx]: true }));
            }
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [exchangeLinks]);

  const handleExchange = (url: string, e: React.MouseEvent) => {
    const inBrowserTab = e.metaKey || e.ctrlKey;
    logInfo('[ExternalLinks] handleExchange click', [{ url, inBrowserTab }]);

    if (onOpenExchangeUrl) {
      onOpenExchangeUrl(url, inBrowserTab);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyFullContext = async () => {
    logInfo('[ExternalLinks] handleCopyWithFullContext click');
    try {
      const destDir = useExporterStore.getState().config?.dest || '';
      const res = await fileExporterApiService.copyLatestExportedFiles(destDir);
      if (res?.success) {
        fileExporterApiService.showNotification('info', res.message || 'Full context copied to clipboard!');
      } else {
        fileExporterApiService.showNotification('error', res.message || 'Failed to copy full context to clipboard!');
      }
    } catch (err: any) {
      fileExporterApiService.showNotification('error', err.message || 'Failed to copy full context to clipboard!');
    }
  };

  const handleCopyExternalPrompt = async () => {
    logInfo('[ExternalLinks] handleCopyExternalPrompt click');
    const mustachePromptTemplate = PREDEFINED_PROMPTS_LIST.find((item) => item.id === 'prompt-4-external-use-bash-replace');
    if (!mustachePromptTemplate) {
      fileExporterApiService.showNotification('error', 'Prompt template not found!');
      return;
    }

    const state = useExporterStore.getState();
    const exportResult: FilesExporterResult | null = state.lastExportResult;

    if (!exportResult) {
      fileExporterApiService.showNotification('error', 'No export result found. Please run an export before copying the external prompt!');
      return;
    }

    logInfo('[ExternalLinks] handleCopyExternalPrompt exportResult', [exportResult]);

    const codebaseExports = exportResult?.generatedFiles?.codebase?.exports || exportResult?.report?.results?.generated_files?.codebase?.exports || [];
    const referenceExports = exportResult?.generatedFiles?.reference?.exports || exportResult?.report?.results?.generated_files?.reference?.exports || [];
    const promptFiles = exportResult?.generatedFiles?.prompt || exportResult?.report?.results?.generated_files?.prompt || [];

    const codebaseCount = codebaseExports.length;
    const referenceCount = referenceExports.length;

    const codebaseFilesList = codebaseExports.map((f) => f.split(/[\\/]/).pop() || f).join('\n');
    const referenceFilesList = referenceExports.map((f) => f.split(/[\\/]/).pop() || f).join('\n');
    const promptFileName = promptFiles.length > 0 ? (promptFiles[0].split(/[\\/]/).pop() || promptFiles[0]) : '';

    let contextText = mustachePromptTemplate.data.context || '';
    contextText = contextText
      .replace(/\{\{\s*REFERENCE_FILES_COUNT\s*\}\}/g, String(referenceCount))
      .replace(/\{\{\s*REFERENCE_FILES\s*\}\}/g, referenceFilesList)
      .replace(/\{\{\s*CODEBASE_FILES_COUNT\s*\}\}/g, String(codebaseCount))
      .replace(/\{\{\s*CODEBASE_FILES\s*\}\}/g, codebaseFilesList)
      .replace(/\{\{\s*PROMPT_FILE\s*\}\}/g, promptFileName);

    const clonedTemplate: PredefinedPromptItem = {
      ...mustachePromptTemplate,
      data: {
        ...mustachePromptTemplate.data,
        context: contextText,
      },
    };

    const finalPrompt = formatPredefinedPromptText(clonedTemplate);

    vsCodeApiService.copyToClipboard(finalPrompt);
    fileExporterApiService.showNotification('info', 'Prompt 4 External usage copied to clipboard!');
  };

  const handleImageError = (idx: number) => {
    setFailedIcons((prev) => ({ ...prev, [idx]: true }));
  };

  const leftContent = (
    <div id="app-logo-title" className="flex items-start gap-2">
      <Button className="h-7 px-4 gap-1.5 text-xs font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              data-tooltip="Copy full context (codebase, references, prompt), as is, of the latest exported files to clipboard"
              onClick={handleCopyFullContext} size="sm">
        <Copy size="{13}"/>
        <span>Full context</span>
      </Button>

      <Button className="h-7 px-2 gap-1.5 text-[11px] font-semibold cursor-pointer hover:bg-muted/60 transition-colors"
              data-tooltip="Copy a prompt template to specifically use with external tool, <br/> this prompt will include an output addon to provide results in a Bash code block"
              onClick={handleCopyExternalPrompt} size="sm" variant="outline">
        <FileText className="shrink-0 text-primary" size="{12}"/>
        <span>Prompt 4 External</span>
      </Button>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-0.5">
      {exchangeLinks.map((link, idx) => {
        const resolvedSrc = resolvedIconUrls[idx];
        const hasIcon = Boolean(resolvedSrc) && !failedIcons[idx];
        const label = link.tooltip || 'Exchange';
        const tooltipText = `🔗 ${label} (${link.url})<br/>• Click: Open in External Browser<br/>• Cmd/Ctrl + Click: Open in VS Code Browser Tab`;

        return (
          <Button key="{idx}"
                  onClick={(e) => handleExchange(link.url, e)}
                  size="sm" variant="outline"
                  className="h-7 px-2 gap-1.5 text-[11px] font-semibold cursor-pointer hover:bg-muted/60 transition-colors"
                  data-tooltip={tooltipText}
          >
            {hasIcon ? (
              <img
                src={resolvedSrc}
                alt={label}
                onError={() => handleImageError(idx)}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
            ) : (
              <ExternalLink className="shrink-0 text-muted-foreground" size="{12}"/>
            )}
            <span className="truncate max-w-[300px]">{label}</span>
            <ExternalLink className="shrink-0 opacity-50 ml-0.5" size="{10}"/>
          </Button>
        );
      })}
    </div>
  );

  return (
    <LeftCenterRightPanel
      left={leftContent}
      right={rightContent}
    />
  );
};

export default ExternalLinks;
