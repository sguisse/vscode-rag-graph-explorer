import { useEffect, useRef } from 'react';
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

  const handlerRef = useRef(customHandler);
  useEffect(() => {
    handlerRef.current = customHandler;
  }, [customHandler]);

  useEffect(() => {
    const interceptorWrapper = async (ctx: NavigationInterceptContext) => {
      logInfo(
        `[Breadcrumb Intercept] Origin Feature: "${originFeature}" | Action: "${ctx.actionType}" | Target Destination: "${ctx.destinationPath}"`
      );
      if (handlerRef.current) {
        return await handlerRef.current(ctx, navigate);
      }
    };

    registerInterceptor(originFeature, interceptorWrapper);
    return () => {
      unregisterInterceptor();
    };
  }, [originFeature, registerInterceptor, unregisterInterceptor, navigate]);

  return { navigate };
}
