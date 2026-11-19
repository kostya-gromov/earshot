// Public surface of the engine. Grows with the runner (M1, PR 3).
export { openSession, MEASUREMENT_CONTEXT, type Session } from './runner/browser.ts';
export { observeStep, type StepObservation } from './runner/observe-step.ts';
export type { Adapter, SetupResult } from './adapters/adapter.ts';
export { createReferenceAdapter } from './adapters/reference.ts';
export { diffAxTrees } from './diff/index.ts';
export { synthesizeSpeech, type SpeechInput } from './speech/index.ts';
