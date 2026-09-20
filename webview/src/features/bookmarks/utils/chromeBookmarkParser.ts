import { TreeBookmarkNode } from '../types/bookmarks.types';

export const parseNetscapeHtml = (html: string): { nodes: TreeBookmarkNode[], expandIds: string[], totalCount: number } => {
  if (!html || typeof html !== 'string') return { nodes: [], expandIds: [], totalCount: 0 };

  const decodeHtml = (str: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  const tokenRegex = /<H3([^>]*)>([\s\S]*?)<\/H3>|<A([^>]*)>([\s\S]*?)<\/A>|<DL\b[^>]*>|<\/DL>/gi;

  const root: TreeBookmarkNode = {
    id: `root_${Date.now()}`,
    name: 'Imported Bookmarks',
    path: [],
    children: [],
    selectionState: 'unchecked'
  };

  const stack: TreeBookmarkNode[] = [root];
  let pendingFolder: TreeBookmarkNode | null = null;
  let counter = 0;
  let totalCount = 0;
  const expandIds: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(html)) !== null) {
    const fullMatch = match[0];

    if (/^<H3/i.test(fullMatch)) {
      const text = match[2] || '';
      const folderName = decodeHtml(text.replace(/<[^>]+>/g, '')).trim() || 'Untitled Folder';
      const currentParent = stack[stack.length - 1];
      const folderPath = [...currentParent.path, folderName];
      const folderId = `folder_import_${Date.now()}_${++counter}`;
      expandIds.push(folderId);

      pendingFolder = {
        id: folderId,
        name: folderName,
        path: folderPath,
        selectionState: 'unchecked',
        children: []
      };
    } else if (/^<DL/i.test(fullMatch) || /^<\/DL/i.test(fullMatch)) {
      if (!fullMatch.startsWith('</')) {
        if (pendingFolder) {
          const currentParent = stack[stack.length - 1];
          if (!currentParent.children) currentParent.children = [];
          currentParent.children.push(pendingFolder);
          stack.push(pendingFolder);
          pendingFolder = null;
        }
      } else if (stack.length > 1) {
        stack.pop();
      }
    } else if (/^<A/i.test(fullMatch)) {
      const attr = match[3] || '';
      const text = match[4] || '';
      const hrefMatch = attr.match(/href=["']([^"']*)["']/i);
      const url = hrefMatch ? hrefMatch[1].trim() : '';

      if (url && !url.toLowerCase().startsWith('javascript:')) {
        const title = decodeHtml(text.replace(/<[^>]+>/g, '')).trim() || url;
        const iconMatch = attr.match(/icon=["']([^"']*)["']/i) || attr.match(/icon_uri=["']([^"']*)["']/i);
        const icon = iconMatch ? iconMatch[1] : '';
        const currentParent = stack[stack.length - 1];
        totalCount++;

        if (!currentParent.children) currentParent.children = [];
        currentParent.children.push({
          id: `bm_import_${Date.now()}_${++counter}`,
          name: title,
          url: url,
          icon: icon || 'Globe',
          iconType: icon ? (icon.startsWith('data:') ? 'base64' : 'url') : 'lucide',
          path: [...currentParent.path],
          selectionState: 'unchecked'
        });
      }
    }
  }

  if (pendingFolder) {
    const currentParent = stack[stack.length - 1];
    if (!currentParent.children) currentParent.children = [];
    currentParent.children.push(pendingFolder);
  }

  return { nodes: root.children || [], expandIds, totalCount };
};
