export const GRAPH_LAYOUT_LIST: readonly string[] = ["preset", "grid", "breadthfirst", "cose"];

export const GRAPH_LAYOUT_ICON_MAP: { [K in (typeof GRAPH_LAYOUT_LIST)[number]]: any } = {
  preset: { icon: "📦", label: "Packages" },
  grid: { icon: "▦", label: "Grid" },
  breadthfirst: { icon: "🌲", label: "Tree (BFS)" },
  cose: { icon: "🧲", label: "Force (Cose)" },
} as const;

export type GraphLayout = (typeof GRAPH_LAYOUT_LIST)[number];

export function isGraphLayout(value: unknown): value is GraphLayout {
  return typeof value === "string" && GRAPH_LAYOUT_LIST.includes(value);
}

export function getGraphLayout(value: unknown): GraphLayout | undefined {
  if (typeof value === "string" && GRAPH_LAYOUT_LIST.includes(value)) {
    return value as GraphLayout;
  }
  return undefined;
}
