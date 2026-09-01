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

  const scopeVal = options?.initialScope;
  const fileName = options?.initialReferenceFileInfo?.fileName;
  const filePath = options?.initialReferenceFileInfo?.filePath;
  const language = options?.initialReferenceFileInfo?.language;

  useEffect(() => {
    if (scopeVal) {
      setScope((prev) => (prev === scopeVal ? prev : scopeVal));
    }
    if (fileName || filePath || language) {
      setReferenceFileInfo((prev) => {
        if (
          prev?.fileName === fileName &&
          prev?.filePath === filePath &&
          prev?.language === language
        ) {
          return prev;
        }
        return { fileName, filePath, language };
      });
    }
  }, [scopeVal, fileName, filePath, language]);

  return {
    scope,
    setScope,
    referenceFileInfo,
  };
}
