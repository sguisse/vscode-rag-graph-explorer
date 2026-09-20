import * as LucideIcons from 'lucide-react';
import { IconType } from '../types/bookmarks.types';

export const resolveIconFormat = (iconStr: string): { type: IconType, value: string } => {
  if (!iconStr) return { type: 'lucide', value: 'Globe' };

  if (iconStr.startsWith('data:image/')) return { type: 'base64', value: iconStr };
  if (/^(http:\/\/|https:\/\/|file:\/\/)/.test(iconStr)) return { type: 'url', value: iconStr };

  const emojiRegex = /\p{Extended_Pictographic}/u;
  if (emojiRegex.test(iconStr)) return { type: 'emoji', value: iconStr };

  return { type: 'lucide', value: iconStr };
};

export const getLucideIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Globe;
};
