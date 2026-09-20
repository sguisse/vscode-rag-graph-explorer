export type IconType = 'lucide' | 'emoji' | 'url' | 'base64';
export type UserRole = 'admin' | 'editor' | 'viewer';
export type LinkHealthStatus = 'healthy' | 'broken' | 'unreachable' | 'ssl_error' | 'checking';
export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';
export type ViewMode = 'compact' | 'grid' | 'thumbnail';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface BaseEntity {
  id: string;
  name: string;
  isPrivate: boolean;
  owner: string;
}

export interface CardSelfLocks {
  lockedPosition: boolean;
  lockedSize: boolean;
  lockedName: boolean;
  lockedDeletion: boolean;
}

export interface CardBookmarkLocks {
  editable: boolean;
  reorderable: boolean;
  urlEditableOnly: boolean;
  removable: boolean;
  addable: boolean;
}

export interface CardLockMatrix {
  cardLocks: CardSelfLocks;
  bookmarkLocks: CardBookmarkLocks;
}

export interface CardBadge {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  iconType: IconType;
}

export interface Bookmark extends BaseEntity {
  description: string;
  url: string;
  icon: string;
  iconType: IconType;
  tags: string[];
  isLocked: boolean;
  healthStatus: LinkHealthStatus;
  clickCount: number;
  lastCheckedAt?: number;
  snoozeUntil?: number;
  isArchived?: boolean;
  previewThumbnail?: string;
  createdAt: number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BookmarkCard extends BaseEntity {
  tabId: string;
  description?: string;
  position: GridPosition;
  locks: CardLockMatrix;
  headerStyle: {
    backgroundColor: string;
    textColor: string;
  };
  contentStyle: {
    backgroundColor: string;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    borderColor: string;
  };
  adaptiveFaviconTheme?: boolean;
  badges: CardBadge[];
  bookmarks: Bookmark[];
  bookmarkDisplayMode?: 'compact' | 'details';
}

export interface BookmarkTab extends BaseEntity {
  description: string;
  isLocked: boolean;
  userRolePermissions: Record<UserRole, boolean>;
  style: {
    tabNameBackgroundColor: string;
    tabNameTextColor: string;
  };
  cards: BookmarkCard[];
  overrides?: Partial<GlobalSettings>;
}

export interface GlobalSettings {
  nbCols: number;
  nbRowsMax: number;
  rowHeight: number;
  gapX: number;
  gapY: number;
  showGridLines: boolean;
  cardsCollisionAlgo: 'Grid' | 'Compact';
  defaultBookmarkDisplayMode: 'compact' | 'details';
  defaultCardHeaderBgColor: string;
  defaultCardHeaderTextColor: string;
  hidePrivate: boolean;
  defaultViewMode?: 'compact' | 'grid';
}

export interface TreeBookmarkNode {
  id: string;
  name: string;
  url?: string;
  icon?: string;
  iconType?: IconType;
  children?: TreeBookmarkNode[];
  path: string[];
  selectionState: CheckboxState;
  addDate?: number;
}
