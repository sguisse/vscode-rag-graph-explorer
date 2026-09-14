import React, { useMemo } from 'react';
import tempHtmlRaw from '../../data/temp-02.html?raw';
import { sanitizeHtmlForRendering } from '../../utils/htmlSanitizer';

export const TempHtmlTab: React.FC = () => {
  const renderedDoc = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark');
    return sanitizeHtmlForRendering(tempHtmlRaw, isDark);
  }, []);

  return (
    <div className="w-full h-full flex flex-col min-h-0 min-w-0 overflow-hidden bg-background">
      <iframe
        srcDoc={renderedDoc}
        title="Maturity Matrix HTML Report"
        className="w-full h-full border-0 flex-1 min-h-0 min-w-0 bg-transparent"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default TempHtmlTab;
