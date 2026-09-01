import React from 'react';
import { useMatches, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BreadcrumbHeader() {
  const matches = useMatches();
  const navigate = useNavigate();

  // Filter routes containing static breadcrumb metadata
  const breadcrumbs = matches
    .filter((match) => match.staticData && (match.staticData as any).breadcrumb)
    .map((match) => ({
      pathname: match.pathname,
      label: (match.staticData as any).breadcrumb as string,
      search: match.search,
    }));

  const canGoBack = matches.length > 2 || (matches.length > 1 && matches[matches.length - 1].pathname !== '/');

  const handleHomeClick = () => {
    console.info('[Navigation Debug] Home Icon Clicked -> Navigating to "/"');
    navigate({ to: '/' });
  };

  const handleBreadcrumbClick = (pathname: string, search: any) => {
    console.info(`[Navigation Debug] Breadcrumb Clicked -> Path: "${pathname}", Search:`, search);
    navigate({ to: pathname, search: search || {} } as any);
  };

  const handleGoBack = () => {
    console.info('[Navigation Debug] Back Button Clicked');
    window.history.back();
  };

  return (
    <header className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border text-xs font-mono select-none h-9 shrink-0">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {canGoBack && (
          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6 mr-1 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleGoBack}
            title="Go Back"
          >
            <ArrowLeft size={13} />
          </Button>
        )}

        <button
          onClick={handleHomeClick}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
          title="Navigate to Home"
        >
          <Home size={13} />
        </button>

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.pathname}-${idx}`}>
              <ChevronRight size={12} className="text-muted-foreground shrink-0" />
              {isLast ? (
                <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(crumb.pathname, crumb.search)}
                  className="text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
        <span className="bg-muted px-2 py-0.5 rounded border border-border">
          TanStack Router Active
        </span>
      </div>
    </header>
  );
}

export default BreadcrumbHeader;
