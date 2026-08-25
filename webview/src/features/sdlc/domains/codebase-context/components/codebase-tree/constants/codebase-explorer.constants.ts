export const DYNAMIC_COLORS = [
  { fill: 'fill-blue-500/20', text: 'text-blue-500', iconColor: 'text-blue-500' },
  { fill: 'fill-emerald-500/20', text: 'text-emerald-500', iconColor: 'text-emerald-500' },
  { fill: 'fill-amber-500/20', text: 'text-amber-500', iconColor: 'text-amber-500' },
  { fill: 'fill-purple-500/20', text: 'text-purple-500', iconColor: 'text-purple-500' },
  { fill: 'fill-pink-500/20', text: 'text-pink-500', iconColor: 'text-pink-500' },
  { fill: 'fill-indigo-500/20', text: 'text-indigo-500', iconColor: 'text-indigo-500' },
  { fill: 'fill-rose-500/20', text: 'text-rose-500', iconColor: 'text-rose-500' },
  { fill: 'fill-cyan-500/20', text: 'text-cyan-500', iconColor: 'text-cyan-500' },
] as const;

export const ALLOWED_TAGS = [
  'config', 'api', 'database', 'ui', 'core', 'model',
  'Service', 'Controller', 'Repository', 'Component', 'RestController', 'Config',
  'Model / Entity', 'DTO', 'Utility', 'Helper', 'Test', 'Integration', 'UnitTest',
  'FunctionalTest', 'PerformanceTest', 'SecurityTest', 'AcceptanceTest', 'EndToEndTest',
  'Mock', 'Stub', 'Adapter', 'Decorator', 'Factory', 'Builder', 'Singleton',
  'Observer', 'Strategy', 'Command', 'Mediator', 'Proxy', 'Visitor'
] as const;

export const LAYER_GROUPS = ["domain.model", "application", "infrastructure", "domain"] as const;

export const TYPOLOGY_GROUPS = [
  "Front-Component",
  "Component",
  "Service",
  "RestController",
  "Controller",
  "Repository",
  "Config",
  "Model / Entity"
] as const;
