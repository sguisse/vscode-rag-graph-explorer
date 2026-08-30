import BMAD_SKILLS_DATA from './data/bmad-skills-by-category.yaml';
import SPECKIT_SKILLS_DATA from './data/speckit-skills-by-category.yaml';
import GSD_SKILLS_DATA from './data/gsd-skills-by-category.yaml';
import VIBE_CODING_SKILLS_DATA from './data/vibe-coding-skills-by-category.yaml';
import { SkillsByCategoryConfig } from './model/skills';

export type InstructionMethodId = 'vibe-coding' | 'vibe' | 'bmad' | 'speckit' | 'gsd';

export interface InstructionMethodOption {
  id: InstructionMethodId;
  label: string;
  emoji: string;
  badge: string;
  title: string;
  description: string;
  data: SkillsByCategoryConfig;
  strategy: string;
  /** Primary text color class for icons & headers */
  color: string;
  /** Selection highlight background & border styling */
  bgSelectionColor: string;
  /** Header banner background & border styling */
  bgBannerColor: string;
  /** Checkbox and input focus accent styling */
  accentColor: string;
}

const vibeCodingOption: InstructionMethodOption = {
  id: 'vibe-coding',
  label: 'Vibe Coding',
  emoji: '✨',
  badge: 'Rapid',
  title: 'Vibe Coding',
  description: 'Rapid, unstructured prompting. Just tell the LLM what you want to achieve with the selected codebase context.',
  data: VIBE_CODING_SKILLS_DATA as SkillsByCategoryConfig,
  strategy: 'vibe-coding',
  color: 'text-amber-400',
  bgSelectionColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  bgBannerColor: 'bg-amber-500/5 border-amber-500/20',
  accentColor: 'focus:ring-amber-500 text-amber-500 accent-amber-500',
};

const bmadOption: InstructionMethodOption = {
  id: 'bmad',
  label: 'BMAD',
  emoji: '🤖',
  badge: 'Framework',
  title: 'BMad Agent Framework',
  description: 'Structured prompting leveraging specific Agents and Skills for high-quality, predictable outputs.',
  data: BMAD_SKILLS_DATA as SkillsByCategoryConfig,
  strategy: 'bmad',
  color: 'text-indigo-400',
  bgSelectionColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  bgBannerColor: 'bg-indigo-500/5 border-indigo-500/20',
  accentColor: 'focus:ring-indigo-500 text-indigo-500 accent-indigo-500',
};

const speckitOption: InstructionMethodOption = {
  id: 'speckit',
  label: 'SpecKit',
  emoji: '🌱',
  badge: 'SDD',
  title: 'SpecKit Driven Dev',
  description: 'Generate code strictly conforming to functional specifications and test criteria.',
  data: SPECKIT_SKILLS_DATA as SkillsByCategoryConfig,
  strategy: 'speckit',
  color: 'text-emerald-400',
  bgSelectionColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  bgBannerColor: 'bg-emerald-500/5 border-emerald-500/20',
  accentColor: 'focus:ring-emerald-500 text-emerald-500 accent-emerald-500',
};

const gsdOption: InstructionMethodOption = {
  id: 'gsd',
  label: 'GSD',
  emoji: '🔀',
  badge: 'Agile',
  title: 'Get Sheet Done (GSD)',
  description: 'Atomic task-driven agile execution loops with continuous feedback and verification.',
  data: GSD_SKILLS_DATA as SkillsByCategoryConfig,
  strategy: 'gsd',
  color: 'text-sky-400',
  bgSelectionColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  bgBannerColor: 'bg-sky-500/5 border-sky-500/20',
  accentColor: 'focus:ring-sky-500 text-sky-500 accent-sky-500',
};

export const INSTRUCTION_METHOD_OPTIONS: InstructionMethodOption[] = [
  vibeCodingOption,
  bmadOption,
  speckitOption,
  gsdOption,
];

export const INSTRUCTION_METHODS: Record<string, InstructionMethodOption> = {
  'vibe-coding': vibeCodingOption,
  'vibe': vibeCodingOption,
  'bmad': bmadOption,
  'speckit': speckitOption,
  'gsd': gsdOption,
};
