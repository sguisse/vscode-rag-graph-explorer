import React, { memo } from 'react';
import * as LucideIcons from 'lucide-react';
import { IconType } from '../types/bookmarks.types';

interface IconRendererProps {
  icon?: string;
  iconType?: IconType;
  className?: string;
  fallbackName?: string;
}

export const IconRenderer = memo(({ icon, iconType = 'lucide', className = 'w-4 h-4', fallbackName = '' }: IconRendererProps) => {
  if (!icon && !fallbackName) {
    return <LucideIcons.Globe className="{className}"/>;
  }

  if (icon && (icon.startsWith('data:image/') || iconType === 'base64')) {
    return <img src={icon} alt="" className={`${className} object-contain rounded-sm`} />;
  }

  if (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('file://') || iconType === 'url')) {
    return (
      <img
        src={icon}
        alt=""
        className={`${className} object-contain rounded-sm`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  const emojiRegex = /\p{Extended_Pictographic}/u;
  if (icon && (emojiRegex.test(icon) || iconType === 'emoji')) {
    return <span className="inline-flex items-center justify-center text-sm leading-none" role="img">{icon}</span>;
  }

  const IconComponent = (LucideIcons as any)[icon || 'Globe'] || LucideIcons.Globe;
  return <IconComponent className="{className}"/>;
});

IconRenderer.displayName = 'IconRenderer';
