import React from 'react';

interface BookmarksTabPanelProps {
  children: React.ReactNode;
}

export const BookmarksTabPanel: React.FC<BookmarksTabPanelProps> = ({ children }) => {
  return (
    <div className="flex-1 min-h-0 relative flex flex-col w-full">
      {children}
    </div>
  );
};
