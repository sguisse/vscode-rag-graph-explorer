export const RULE_PATTERN_LIST: readonly string[] = ["layer-bypass", "cyclic", "orphan"];

export const RULE_PATTERN_ICON_MAP: { [K in (typeof RULE_PATTERN_LIST)[number]]: any } = {
  "layer-bypass": { icon: "⚠️", label: "Layer bypass detection" },
  cyclic: { icon: "🔄", label: "Cyclic dependencies detected" },
  orphan: { icon: "👻", label: "Orphan methods" },
} as const;

export type RulePattern = (typeof RULE_PATTERN_LIST)[number];

export function isRulePattern(value: unknown): value is RulePattern {
  return typeof value === "string" && RULE_PATTERN_LIST.includes(value);
}

export function getRulePattern(value: unknown): RulePattern | undefined {
  if (typeof value === "string" && RULE_PATTERN_LIST.includes(value)) {
    return value as RulePattern;
  }
  return undefined;
}
