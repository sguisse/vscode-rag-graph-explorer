export const IMPACT_DIRECTION_LIST: readonly string[] = ["aval", "amont"];

export const IMPACT_DIRECTION_ICON_MAP: { [K in (typeof IMPACT_DIRECTION_LIST)[number]]: any } = {
  aval: { icon: "⬇️", label: "Downstream" },
  amont: { icon: "⬆️", label: "Upstream" },
} as const;

export type ImpactDirection = (typeof IMPACT_DIRECTION_LIST)[number];

export function isImpactDirection(value: unknown): value is ImpactDirection {
  return typeof value === "string" && IMPACT_DIRECTION_LIST.includes(value);
}

export function getImpactDirection(value: unknown): ImpactDirection | undefined {
  if (typeof value === "string" && IMPACT_DIRECTION_LIST.includes(value)) {
    return value as ImpactDirection;
  }
  return undefined;
}
