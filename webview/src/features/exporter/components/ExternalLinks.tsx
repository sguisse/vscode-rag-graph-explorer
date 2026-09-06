import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { resolveIconUrlAsync } from '@/lib/utils-image';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface ExchangeLink {
  icon?: string;
  tooltip?: string;
  url: string;
}

interface ExternalLinksProps {
  exchangeLinks?: ExchangeLink[];
  onOpenExchangeUrl?: (url: string) => void;
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

  const handleExchange = (url: string) => {
    logInfo('[ExternalLinks] handleExchange click', [url]);
    if (onOpenExchangeUrl) {
      onOpenExchangeUrl(url);
    } else if (typeof window !== 'undefined' && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = (idx: number) => {
    setFailedIcons((prev) => ({ ...prev, [idx]: true }));
  };

  if (!exchangeLinks || exchangeLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
      {exchangeLinks.map((link, idx) => {
        const resolvedSrc = resolvedIconUrls[idx];
        const hasIcon = Boolean(resolvedSrc) && !failedIcons[idx];
        const tooltipText = link.tooltip
          ? `🔗 ${link.tooltip} (${link.url})`
          : `🔗 ${link.url}`;

        return (
          <Button
            key={idx}
            size="sm"
            variant="outline"
            onClick={() => handleExchange(link.url)}
            className="h-7 px-2 gap-1.5 text-[11px] font-semibold cursor-pointer hover:bg-muted/60 transition-colors"
            data-tooltip={tooltipText}
          >
            {hasIcon ? (
              <img
                src={resolvedSrc}
                alt={link.tooltip || 'Exchange'}
                onError={() => handleImageError(idx)}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
            ) : (
              <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
            )}
            <span className="truncate max-w-[120px]">
              {link.tooltip || 'Exchange'}
            </span>
            <ExternalLink size={10} className="shrink-0 opacity-50 ml-0.5" />
          </Button>
        );
      })}
    </div>
  );
};

export default ExternalLinks;
