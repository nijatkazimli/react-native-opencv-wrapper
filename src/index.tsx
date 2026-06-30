// Public entry point.
//
// Importing "./ops" both registers every op's fluent method on `Pipeline`
// (side effect) and re-exports each op's public parameter types (e.g.
// `Interpolation`, `FlipDirection`, `ThresholdType`, `RotateAngle`).
export * from "./ops";

export { pipeline, Pipeline } from "./core/pipeline";
export type {
  ReadyPipeline,
  ImageFormat,
  PipelineRecipe,
} from "./core/pipeline";

export { presets } from "./presets";
export type { PresetName } from "./presets";

export * from "./standalone";
