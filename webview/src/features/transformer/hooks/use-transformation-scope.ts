import { useState, useEffect } from 'react';
import { TransformationScopeType, ReferenceFileInfo } from '../components/TransformationScopePanel';

export interface UseTransformationScopeOptions {
  initialScope?: TransformationScopeType;
  initialReferenceFileInfo?: ReferenceFileInfo;
}

export function useTransformationScope(options?: UseTransformationScopeOptions) {
  const [scope, setScope] = useState<TransformationScopeType>(options?.initialScope || 'Default');
  const [referenceFileInfo, setReferenceFileInfo] = useState<ReferenceFileInfo | undefined>(
    options?.initialReferenceFileInfo
  );

  useEffect(() => {
    if (options?.initialScope) {
      setScope(options.initialScope);
    }
    if (options?.initialReferenceFileInfo) {
      setReferenceFileInfo(options.initialReferenceFileInfo);
    }
  }, [options?.initialScope, options?.initialReferenceFileInfo]);

  return {
    scope,
    setScope,
    referenceFileInfo,
  };
}
