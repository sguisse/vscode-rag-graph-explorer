import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { ExportExchangeLink } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface ExternalLinksProps {
  exchangeLinks?: ExportExchangeLink[];
  onOpenExchangeUrl: (url: string) => void;
}

export const ExternalLinks: React.FC<ExternalLinksProps> = ({
  exchangeLinks = [],
  onOpenExchangeUrl,
}) => {
  const handleExchange = (url: string) => {
    logInfo('[ExternalLinks] onOpenExchangeUrl handler triggered', [url]);
    onOpenExchangeUrl(url);
  };

  return (
    <div className="flex items-center gap-2">
      {exchangeLinks && exchangeLinks.length > 0 ? (
        exchangeLinks.map((link, idx) => (
          <Button
            key={idx}
            size="sm"
            variant="outline"
            onClick={() => handleExchange(link.url)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            data-tooltip={link.tooltip}
          >
            {link.icon ? (
              <img src={link.icon} alt={link.tooltip || 'Exchange'} className="w-4 h-4 object-contain" />
            ) : (
              <ExternalLink size={12} />
            )}
            {link.tooltip || 'Exchange'}
          </Button>
        ))
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExchange('https://gemini.google.com/')}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ExternalLink size={12} />
            Gemini
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExchange('https://notebooklm.google.com/')}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ExternalLink size={12} />
            NotebookLM
          </Button>
        </>
      )}
    </div>
  );
};

export default ExternalLinks;
