export interface FindableTreeItem {
  id: string;
  name: string;
  isFolder?: boolean;
  path?: string;
  children?: FindableTreeItem[];
  parentId?: string;
  tags?: string[];
}
