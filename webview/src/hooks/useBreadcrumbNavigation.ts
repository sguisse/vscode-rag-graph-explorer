import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useBreadcrumbInterceptorStore, NavigationInterceptContext } from '@/store/useBreadcrumbInterceptorStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function useBreadcrumbNavigation(
  originFeature: string,
  customHandler?: (
    ctx: NavigationInterceptContext,
    navigate: ReturnType<typeof useNavigate>
  ) => string | boolean | void | Promise<string | boolean | void>
) {
  const navigate = useNavigate();
  const registerInterceptor = useBreadcrumbInterceptorStore((s) => s.registerInterceptor);
  const unregisterInterceptor = useBreadcrumbInterceptorStore((s) => s.unregisterInterceptor);

  const handleIntercept = useCallback(
    async (ctx: NavigationInterceptContext) => {
      logInfo(
        `[Breadcrumb Intercept] Origin Feature: "${originFeature}" | Action: "${ctx.actionType}" | Target Destination: "${ctx.destinationPath}"`
      );

      if (customHandler) {
        return await customHandler(ctx, navigate);
      }
    },
    [originFeature, customHandler, navigate]
  );

  useEffect(() => {
    registerInterceptor(originFeature, handleIntercept);
    return () => {
      unregisterInterceptor();
    };
  }, [originFeature, handleIntercept, registerInterceptor, unregisterInterceptor]);

  return { navigate };
}
