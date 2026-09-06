import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, FileText } from 'lucide-react';
import { resolveIconUrlAsync } from '@/lib/utils-image';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';

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

  const handleCopyExternalPrompt = () => {
    logInfo('[ExternalLinks] handleCopyExternalPrompt click');
    const mustachePromptTemplate = `### 🎭 Role
  {{ ROLE_AGENT }}

### 🗣 Tone
  {{ TONE }}

### 🛠️ Global Context & Scope
  You must load and respect the following attachment file which contains rules as the foundation of the project.
    {{ GLOBAL_CONTEXT_SCOPE }}

### 🧠 Task Context & Scope
  You have to load the following attachment file which contains the codebase to analyse as implied in the task.
    {{ TASK_CONTEXT_SCOPE }}

### 🎯 Expected Deliverables
  {{ EXPECTED_DELIVERABLES }}

### 🧭 Output Format & Constraints
  {{ OUTPUT_FORMAT_CONSTRAINTS }}

### 💡 Reference / Samples
  {{ REFERENCE_SAMPLES }}`;

    vsCodeApiService.copyToClipboard(mustachePromptTemplate);
    fileExporterApiService.showNotification('info', 'Externalized template prompt copied to clipboard!');
  };

  const handleImageError = (idx: number) => {
    setFailedIcons((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopyExternalPrompt}
        className="h-7 px-2 gap-1.5 text-[11px] font-semibold cursor-pointer hover:bg-muted/60 transition-colors"
        data-tooltip="Copy externalized prompt template with Mustache placeholders"
      >
        <FileText size={12} className="shrink-0 text-primary" />
        <span>Copy External Prompt</span>
        <Copy size={10} className="shrink-0 opacity-50 ml-0.5" />
      </Button>

      {exchangeLinks.map((link, idx) => {
        const resolvedSrc = resolvedIconUrls[idx];
        const hasIcon = Boolean(resolvedSrc) && !failedIcons[idx];
        const label = link.tooltip || 'Exchange';
        const tooltipText = `🔗 ${label} (${link.url})<br/>• Click: Open in External Browser<br/>• Cmd/Ctrl + Click: Open in VS Code Browser Tab`;

        return (
          <Button
            key={idx}
            size="sm"
            variant="outline"
            onClick={(e) => handleExchange(link.url, e)}
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
              <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
            )}
            <span className="truncate max-w-[120px]">{label}</span>
            <ExternalLink size={10} className="shrink-0 opacity-50 ml-0.5" />
          </Button>
        );
      })}
    </div>
  );
};

export default ExternalLinks;
