import { useState } from 'react';
import { OutputPanelTab } from '../types/output-panel.types';

export function useOutputPanel() {
  const [activeTab, setActiveTab] = useState<OutputPanelTab>('template');
  return { activeTab, setActiveTab };
}
