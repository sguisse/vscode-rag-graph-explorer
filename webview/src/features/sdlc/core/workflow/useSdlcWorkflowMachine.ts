import { create } from 'zustand';

export type SdlcStep =
  | 'CODEBASE_CONTEXT'
  | 'VIBE_CODING'
  | 'BMAD_METHOD'
  | 'SPECKIT'
  | 'LLM_CHAT'
  | 'RESULTS_MANAGER'
  | 'CONFIGURATION';

export interface SdlcWorkflowMachineState {
  currentStep: SdlcStep;
  transitionTo: (step: SdlcStep) => void;
}

/**
 * Headless state machine controlling the active view.
 * SdlcLayoutOrchestrator listens to this to map domains to UI containers.
 */
export const useSdlcWorkflowMachine = create<SdlcWorkflowMachineState>((set) => ({
  currentStep: 'CODEBASE_CONTEXT',
  transitionTo: (step) => set({ currentStep: step })
}));
