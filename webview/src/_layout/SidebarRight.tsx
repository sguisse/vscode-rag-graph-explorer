import React from 'react';
import {
  useWorkspaceContentVersionStore,
  DefaultSidebarRightContentV1,
  DefaultSidebarRightContentV2,
} from '@/features/layout-demo/default-layout-containers-content';

export function SidebarRight() {
  const version = useWorkspaceContentVersionStore((s) => s.versions.sidebarRight) || '1';

  return version === '2' ? <DefaultSidebarRightContentV2 /> : <DefaultSidebarRightContentV1 />;
}
