import { GlobalSettings, BookmarkTab } from '../types/bookmarks.types';

export interface ExportPayload {
  version: string;
  exportedAt: number;
  globalSettings: GlobalSettings;
  tabs: BookmarkTab[];
}

export const exportWorkspaceJson = (globalSettings: GlobalSettings, tabs: BookmarkTab[]) => {
  const exportPayload: ExportPayload = {
    version: '1.1.0',
    exportedAt: Date.now(),
    globalSettings,
    tabs
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `enterprise_bookmarks_${Date.now()}.json`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
};

export const parseImportedJson = (jsonString: string): ExportPayload | null => {
  try {
    const data = JSON.parse(jsonString);
    if (data && data.version && data.tabs) {
      return data as ExportPayload;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse workspace JSON", error);
    return null;
  }
};
