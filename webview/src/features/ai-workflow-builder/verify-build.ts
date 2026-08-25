import { runWorkflowSanityTests } from './utils/dag-engine.test';

// Automated verification runner executed during development or testing
export function verifyWorkflowBuilderFeature(): boolean {
  return runWorkflowSanityTests();
}

if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
  verifyWorkflowBuilderFeature();
}
