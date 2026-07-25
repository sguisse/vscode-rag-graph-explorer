import React from 'react';
import {
  useWorkspaceContentVersionStore,
  DefaultSidebarRightContentV1,
  DefaultSidebarRightContentV2,
} from './default-workspace-containers-content';

export function AppSidebarRight() {
  const version = useWorkspaceContentVersionStore((s) => s.versions.sidebarRight) || '1';

  return version === '2' ? <DefaultSidebarRightContentV2 /> : <DefaultSidebarRightContentV1 />;
}
