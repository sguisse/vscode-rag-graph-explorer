export const SELECTED_ENTITY_TYPE_LIST: readonly string[] = ["node", "member", "edge"];

export const SELECTED_ENTITY_TYPE_ICON_MAP: { [K in (typeof SELECTED_ENTITY_TYPE_LIST)[number]]: any } = {
  node: { icon: "📄", label: "Node" },
  member: { icon: "🧩", label: "Member" },
  edge: { icon: "🔀", label: "Edge" },
} as const;

export type SelectedEntityType = "node" | "member" | "edge";

export function isSelectedEntityType(value: unknown): value is SelectedEntityType {
  return typeof value === "string" && SELECTED_ENTITY_TYPE_LIST.includes(value);
}

export function getSelectedEntityType(value: unknown): SelectedEntityType | undefined {
  if (typeof value === "string" && SELECTED_ENTITY_TYPE_LIST.includes(value)) {
    return value as SelectedEntityType;
  }
  return undefined;
}
