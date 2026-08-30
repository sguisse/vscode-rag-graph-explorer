/**
 * Key-value mapping of prompt template names to prompt instruction strings.
 */
export interface PromptMap {
  [promptKey: string]: string;
}

/**
 * Domain-specific prompt definitions where the key represents the domain name (e.g., 'vc4i', 'ecommerce').
 */
export interface DomainPrompts {
  [domainName: string]: PromptMap;
}

/**
 * Represents an individual skill item contained within a category.
 */
export interface Skill {
  /** Unique icon name identifier */
  icon: string;
  /** Visual emoji symbol */
  emoji: string;
  /** Human-readable skill name */
  name: string;
  /** Description of the skill functionality */
  description: string;
  /** Associated command identifier */
  command: string;
  /** Optional domain-specific prompts and instructions */
  prompts?: DomainPrompts[];
}

/**
 * Represents a top-level category grouping related skills.
 */
export interface SkillCategory {
  /** Unique category identifier */
  id: string;
  /** Display title for the category */
  title: string;
  /** Summary of the category purpose or phase */
  description: string;
  /** Category icon identifier */
  icon: string;
  /** Visual emoji symbol */
  emoji: string;
  /** List of skills within this category */
  skills: Skill[];
  /** Default UI state indicating whether the category is collapsed */
  collapsed?: boolean;
}

/**
 * Complete file representation as an array of skill categories.
 */
export type SkillsByCategoryConfig = SkillCategory[];
