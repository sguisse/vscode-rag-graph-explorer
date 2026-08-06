export const ATTRIBUTE_VISIBILITY_LIST: readonly string[] = ["private", "public", "protected"];

export const ATTRIBUTE_VISIBILITY_ICON_MAP: { [K in (typeof ATTRIBUTE_VISIBILITY_LIST)[number]]: any } = {
  private: { icon: "🔒", label: "Private" },
  public: { icon: "🌐", label: "Public" },
  protected: { icon: "🛡️", label: "Protected" },
} as const;

export type AttributeVisibility = (typeof ATTRIBUTE_VISIBILITY_LIST)[number];

export function isAttributeVisibility(value: unknown): value is AttributeVisibility {
  return typeof value === "string" && ATTRIBUTE_VISIBILITY_LIST.includes(value);
}

export function getAttributeVisibility(value: unknown): AttributeVisibility | undefined {
  if (typeof value === "string" && ATTRIBUTE_VISIBILITY_LIST.includes(value)) {
    return value as AttributeVisibility;
  }
  return undefined;
}
