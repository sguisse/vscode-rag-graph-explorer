export const EDGE_LINE_STYLE_LIST = ['solid', 'dotted', 'dashed'] as const;
export type EdgeLineStyle = (typeof EDGE_LINE_STYLE_LIST)[number];

export const EDGE_CURVE_STYLE_LIST = [
  'haystack',
  'straight',
  'bezier',
  'unbundled-bezier',
  'segments',
  'taxi',
] as const;
export type EdgeCurveStyle = (typeof EDGE_CURVE_STYLE_LIST)[number];

export const EDGE_ARROW_SHAPE_LIST = [
  'triangle',
  'triangle-tee',
  'circle-triangle',
  'triangle-cross',
  'triangle-backcurve',
  'vee',
  'tee',
  'square',
  'circle',
  'diamond',
  'chevron',
  'none',
] as const;
export type EdgeArrowShape = (typeof EDGE_ARROW_SHAPE_LIST)[number];
