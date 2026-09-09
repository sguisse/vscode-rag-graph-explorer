import React, { useEffect, useRef } from 'react';
import helpHtml from './help-content.html?raw';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export const HelpTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopySamplePrompt = (e: Event) => {
      e.preventDefault();
      logInfo('[HelpTab] handleCopySamplePrompt triggered');
      const samplePromptEl = container.querySelector('#sample-prompt-content');
      if (samplePromptEl) {
        const text = (samplePromptEl as HTMLElement).innerText;
        vsCodeApiService.copyToClipboard(text);
        fileExporterApiService.showNotification('info', 'Sample prompt copied to clipboard!');
      }
    };

    const handleCopyOutputRules = (e: Event) => {
      e.preventDefault();
      logInfo('[HelpTab] handleCopyOutputRules triggered');
      const outputRulesEl = container.querySelector('#sample-output-rules-content');
      if (outputRulesEl) {
        const text = (outputRulesEl as HTMLElement).innerText;
        vsCodeApiService.copyToClipboard(text);
        fileExporterApiService.showNotification('info', 'Output rules copied to clipboard!');
      }
    };

    const btnSamplePrompt = container.querySelector('#btn-copy-sample-prompt');
    const btnOutputRules = container.querySelector('#btn-copy-output-rules');

    btnSamplePrompt?.addEventListener('click', handleCopySamplePrompt);
    btnOutputRules?.addEventListener('click', handleCopyOutputRules);

    return () => {
      btnSamplePrompt?.removeEventListener('click', handleCopySamplePrompt);
      btnOutputRules?.removeEventListener('click', handleCopyOutputRules);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="p-2 h-full min-h-0 overflow-y-auto bg-background text-foreground"
      dangerouslySetInnerHTML={{ __html: helpHtml }}
    />
  );
};

export default HelpTab;
