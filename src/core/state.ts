// ---------------------------------------------------------------------------
// Phantom state markers (internal)
// ---------------------------------------------------------------------------
//
// String-literal markers (instead of true/false) so a missing-setter mistake
// surfaces a TypeScript error that literally names `"missing-input"` /
// `"missing-output"`. Internal only — they exist to spell the `Pipeline`
// generics and are never re-exported from the package entry point.

/** @internal */
export type InputState = "input-set" | "missing-input";
/** @internal */
export type OutputState = "output-set" | "missing-output";
