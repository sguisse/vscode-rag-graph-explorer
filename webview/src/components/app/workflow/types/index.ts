export * from './type-edge-arrow-shape.gen';
export * from './type-edge-curve-style.gen';
export * from './type-edge-line-style.gen';

export * from './type-node-status.gen';
export * from './type-node-type.gen';

export function isCurrentStatus(value: unknown): boolean {
  return value === 'current';
}
