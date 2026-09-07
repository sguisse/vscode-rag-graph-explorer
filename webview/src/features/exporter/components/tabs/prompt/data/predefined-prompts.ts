
import PREDEFINED_PROMPTS from './predefined-prompts.yaml';

export interface PredefinedPromptItem {
  id: string;
  name: string;
  description?: string;
  data: {
    mode?: string;
    roleOrAgent?: string;
    selectedAgent?: string;
    tone?: string;
    context?: string;
    expected?: string;
    output?: string;
    samples?: string;
  };
}

// Cast the untyped imported YAML array to the TypeScript interface
export const PREDEFINED_PROMPTS_LIST = PREDEFINED_PROMPTS as PredefinedPromptItem[];


export function formatPredefinedPromptText(promptItem: PredefinedPromptItem): string {
  const d = promptItem.data;
  const parts: string[] = [];

  if (d.roleOrAgent) {
    parts.push(`### 🎭 Role\n${d.roleOrAgent}`);
  }
  if (d.tone) {
    parts.push(`### 🗣 Tone\n${d.tone}`);
  }
  if (d.context) {
    parts.push(`### 🛠️ Global Context & Scope\n${d.context}`);
  }
  if (d.expected) {
    parts.push(`### 🎯 Expected Deliverables\n${d.expected}`);
  }
  if (d.output) {
    parts.push(`### 🧭 Output Format & Constraints\n${d.output}`);
  }
  if (d.samples) {
    parts.push(`### 💡 Reference / Samples\n${d.samples}`);
  }

  return parts.join('\n\n');
}
