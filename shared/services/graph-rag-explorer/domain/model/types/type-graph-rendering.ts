export const GRAPH_RENDERING_LIST: readonly string[] = ["condensed", "uml"];

export const GRAPH_RENDERING_ICON_MAP: { [K in (typeof GRAPH_RENDERING_LIST)[number]]: any } = {
  condensed: { icon: "📦", label: "Condensed" },
  uml: { icon: "📐", label: "UML" },
} as const;

export type GraphRendering = (typeof GRAPH_RENDERING_LIST)[number];

export function isGraphRendering(value: unknown): value is GraphRendering {
  return typeof value === "string" && GRAPH_RENDERING_LIST.includes(value);
}

export function getGraphRendering(value: unknown): GraphRendering | undefined {
  if (typeof value === "string" && GRAPH_RENDERING_LIST.includes(value)) {
    return value as GraphRendering;
  }
  return undefined;
}
