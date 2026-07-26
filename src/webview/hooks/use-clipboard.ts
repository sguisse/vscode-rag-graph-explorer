import { useState, useCallback } from 'react';
import { copyToClipboard } from '@/lib/utils';

export function useCopyToClipboard(timeout = 3000) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string, onCopyCallback?: () => void) => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      if (onCopyCallback) onCopyCallback();
      setTimeout(() => setIsCopied(false), timeout);
    }
    return success;
  }, [timeout]);

  return { isCopied, copy };
}
