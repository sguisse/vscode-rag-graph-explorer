
export interface Skill {
  icon: string;
  emoji: string;
  name: string;
  description: string;
  command: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
  skills: Skill[];
  collapsed?: boolean;
}
