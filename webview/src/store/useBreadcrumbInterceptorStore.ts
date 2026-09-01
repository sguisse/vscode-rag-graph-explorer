import { create } from 'zustand';

export type NavigationActionType = 'back' | 'breadcrumb' | 'home';

export interface NavigationInterceptContext {
  originFeature: string;
  actionType: NavigationActionType;
  destinationPath: string;
}

export type BreadcrumbInterceptorFn = (
  ctx: NavigationInterceptContext
) => string | boolean | void | Promise<string | boolean | void>;

interface BreadcrumbInterceptorState {
  interceptor: BreadcrumbInterceptorFn | null;
  originFeature: string | null;
  registerInterceptor: (originFeature: string, fn: BreadcrumbInterceptorFn) => void;
  unregisterInterceptor: () => void;
}

export const useBreadcrumbInterceptorStore = create<BreadcrumbInterceptorState>((set) => ({
  interceptor: null,
  originFeature: null,
  registerInterceptor: (originFeature, fn) => set({ originFeature, interceptor: fn }),
  unregisterInterceptor: () => set({ originFeature: null, interceptor: null }),
}));
