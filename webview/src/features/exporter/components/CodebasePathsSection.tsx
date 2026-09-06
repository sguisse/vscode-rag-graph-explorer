import React from 'react';
import { PathsSection, PathsSectionProps } from './PathsSection';

export type CodebasePathsSectionProps = Omit<PathsSectionProps, 'scopeType' | 'title' | 'tooltip'>;

export const CodebasePathsSection: React.FC<CodebasePathsSectionProps> = (props) => (
  <PathsSection
    scopeType="codebase"
    title="📁 Codebase Source Paths"
    tooltip="Absolute directory or single file locations targeted for codebase extraction context."
    {...props}
  />
);

export default CodebasePathsSection;
