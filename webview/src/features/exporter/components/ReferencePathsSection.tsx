import React from 'react';
import { PathsSection, PathsSectionProps } from './PathsSection';

export type ReferencePathsSectionProps = Omit<PathsSectionProps, 'scopeType' | 'title' | 'tooltip'>;

export const ReferencePathsSection: React.FC<ReferencePathsSectionProps> = (props) => (
  <PathsSection
    scopeType="reference"
    title="📚 Reference Source Paths"
    tooltip="Reference documentation or sample files targeted for LLM context injection."
    {...props}
  />
);

export default ReferencePathsSection;
