import { PaletteItemDefinition } from '../model-ui';

export const PALETTE_ITEMS: PaletteItemDefinition[] = [
  {
    type: 'textInput',
    label: 'Text Input',
    category: 'Inputs',
    description: 'The starting prompt for the flow',
    iconName: 'Type',
  },
  {
    type: 'markdownFile',
    label: 'Markdown File',
    category: 'Inputs',
    description: 'A Markdown instruction file for the flow',
    iconName: 'FileText',
  },
  {
    type: 'aiAgent',
    label: 'AI Agent',
    category: 'Agent',
    description: 'Runs an LLM with tool calling',
    iconName: 'Bot',
    badge: 'Core',
  },
  {
    type: 'searchTool',
    label: 'Search Reddit',
    category: 'Tools',
    description: 'Finds trending posts in a subreddit',
    iconName: 'Search',
  },
  {
    type: 'script',
    label: 'Script Execution',
    category: 'Scripts',
    description: 'Execute Python or Bash scripts with argument inputs',
    iconName: 'Terminal',
  },
  {
    type: 'argument',
    label: 'Script Argument',
    category: 'Scripts',
    description: 'Key/Value input argument for script execution',
    iconName: 'Variable',
  },
  {
    type: 'outputAnalyzer',
    label: 'Output Analyzer',
    category: 'Logic',
    description: 'Evaluates workflow output with OK / KO branch endpoints',
    iconName: 'GitFork',
  },
  {
    type: 'formattedOutput',
    label: 'Formatted Output',
    category: 'Output',
    description: 'Renders the result as Markdown',
    iconName: 'LayoutTemplate',
  },
  {
    type: 'annotation',
    label: 'Annotation Note',
    category: 'Annotations',
    description: 'Movable setup notes box with dashed link',
    iconName: 'Info',
  },
];
