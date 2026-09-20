import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { BookmarksManagerPanel } from '../BookmarksManagerPanel';

export const CenterPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader isHiddable={false} path="workspace.center" title="Bookmarks"/>
      <div className="flex-1 min-h-0 overflow-hidden">
        <BookmarksManagerPanel/>
      </div>
    </div>
  );
};

export default CenterPanelContainer;
