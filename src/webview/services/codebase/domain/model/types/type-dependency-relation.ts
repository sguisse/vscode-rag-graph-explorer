export const DEPENDENCY_RELATION_LIST: readonly string[] = [
  "dependency",
  "association",
  "aggregation",
  "composition",
  "implementation",
  "extends",
];

export const DEPENDENCY_RELATION_ICON_MAP: { [K in (typeof DEPENDENCY_RELATION_LIST)[number]]: any } = {
  dependency: { icon: "➡️", label: "Dependency" },
  association: { icon: "🔗", label: "Association" },
  aggregation: { icon: "💎", label: "Aggregation" },
  composition: { icon: "◆", label: "Composition" },
  implementation: { icon: "🛠️", label: "Implementation" },
  extends: { icon: "↗️", label: "Extends" },
} as const;

export type DependencyRelation = (typeof DEPENDENCY_RELATION_LIST)[number];

export function isDependencyRelation(value: unknown): value is DependencyRelation {
  return typeof value === "string" && DEPENDENCY_RELATION_LIST.includes(value);
}

export function getDependencyRelation(value: unknown): DependencyRelation | undefined {
  if (typeof value === "string" && DEPENDENCY_RELATION_LIST.includes(value)) {
    return value as DependencyRelation;
  }
  return undefined;
}
