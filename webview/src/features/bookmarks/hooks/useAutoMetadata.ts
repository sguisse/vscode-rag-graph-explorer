import { useCallback } from 'react';
import { IconType } from '../types/bookmarks.types';

interface AutoMetadataResult {
  name: string;
  icon: string;
  iconType: IconType;
  description: string;
}

export const useAutoMetadata = () => {
  const fetchMetadata = useCallback(async (url: string, currentName?: string, currentDesc?: string): Promise<AutoMetadataResult | null> => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace('www.', '');
      const guessedName = currentName || domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
      const guessedFavicon = `[https://www.google.com/s2/favicons?domain=$](https://www.google.com/s2/favicons?domain=$){domain}&sz=64`;

      return {
        name: guessedName,
        icon: guessedFavicon,
        iconType: 'url',
        description: currentDesc || `Enterprise link reference to ${domain}`
      };
    } catch (e) {
      console.error("Invalid URL for metadata extraction");
      return null;
    }
  }, []);

  return { fetchMetadata };
};
