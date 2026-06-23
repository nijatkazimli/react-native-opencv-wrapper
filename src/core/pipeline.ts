import NativeOpenCV from "../NativeReactNativeOpencvWrapper";
import type { InputState, OutputState } from "./state";

/**
 * A serialized pipeline step: an op `type` plus its parameters. This is the
 * wire format sent to the native side as JSON. The JS layer stays untyped on
 * purpose — each op's public, typed builder method is contributed separately
 * (see {@link registerOp}) and native validation is the source of truth.
 */
export type SerializedOp = { type: string } & Record<string, unknown>;

/**
 * Operation argument map extended by each op module via declaration merging.
 *
 * Example in an op file:
 *
 * `declare module "../core/pipeline" { interface OpArgsMap { gray: [] } }`
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OpArgsMap {}

/**
 * A {@link Pipeline} whose `input` and `output` have both been provided —
 * the only receiver shape {@link Pipeline.run} accepts. Used as a
 * self-documenting alias so a missing-setter TypeScript error reads
 * `... not assignable to method's 'this' of type 'ReadyPipeline'`.
 */
export type ReadyPipeline = Pipeline<"input-set", "output-set">;

type OpBuilder = (...args: readonly unknown[]) => Record<string, unknown>;
const OP_BUILDERS = new Map<string, OpBuilder>();

/**
 * Phantom shape merged into {@link Pipeline} so the `Input`/`Output` generics
 * participate in the class's structural type. Op builder methods are merged
 * into this same interface from each op module via declaration merging.
 */
export interface Pipeline<
  Input extends InputState = "missing-input",
  Output extends OutputState = "missing-output",
> {
  readonly __state?: [Input, Output];
}

/**
 * Fluent, type-safe builder that chains OpenCV operations on a single image
 * and runs them in one native pass (read once, transform in memory, write
 * once).
 *
 * This orchestrator only owns the input/output/run/clone lifecycle. The
 * per-operation methods (`gray`, `gaussianBlur`, ...) are registered by the
 * op modules under `src/ops`, so this file never grows when ops are added.
 *
 * @typeParam Input  `"input-set"` once {@link Pipeline.input} is called.
 * @typeParam Output `"output-set"` once {@link Pipeline.output} is called.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Pipeline<
  Input extends InputState = "missing-input",
  Output extends OutputState = "missing-output",
> {
  private _input?: string;
  private _output?: string;
  private readonly ops: SerializedOp[] = [];

  /** Set the absolute source image path (no `file://` scheme). */
  input(path: string): Pipeline<"input-set", Output> {
    this._input = path;
    return this as unknown as Pipeline<"input-set", Output>;
  }

  /** Set the absolute output path; written once after all steps run. */
  output(path: string): Pipeline<Input, "output-set"> {
    this._output = path;
    return this as unknown as Pipeline<Input, "output-set">;
  }

  /**
   * Append a serialized op. Called by the methods installed via
   * {@link registerOp}; not intended for direct use.
   * @internal
   */
  enqueue(op: SerializedOp): this {
    this.ops.push(op);
    return this;
  }

  /**
   * Return an independent copy preserving input/output state and queued ops,
   * so a shared base can branch into variants without sharing the op list.
   */
  clone(): Pipeline<Input, Output> {
    const copy = new Pipeline<Input, Output>();
    copy._input = this._input;
    copy._output = this._output;
    copy.ops.push(...this.ops.map((op) => ({ ...op })));
    return copy;
  }

  /**
   * Execute all queued steps natively in a single pass and resolve with the
   * output path. Only callable on a {@link ReadyPipeline}; the `this:`
   * constraint makes a missing `input`/`output` a compile-time error.
   */
  run(this: ReadyPipeline): Promise<string> {
    if (this.ops.length === 0) {
      return Promise.reject(new Error("Pipeline: no steps queued"));
    }
    return NativeOpenCV.runPipeline(
      this._input!,
      this._output!,
      JSON.stringify(this.ops),
    );
  }
}

/** Create a new {@link Pipeline} for chaining OpenCV operations. */
export function pipeline(): Pipeline {
  return new Pipeline();
}

/**
 * Run a single op through the same native pipeline engine used by
 * {@link Pipeline.run}.
 */
export function runStandaloneOp<Name extends keyof OpArgsMap & string>(
  name: Name,
  inputPath: string,
  outputPath: string,
  ...args: OpArgsMap[Name]
): Promise<string> {
  const build = OP_BUILDERS.get(name);
  if (!build) {
    return Promise.reject(new Error(`Unknown op '${name}'`));
  }
  return NativeOpenCV.runPipeline(
    inputPath,
    outputPath,
    JSON.stringify([{ type: name, ...build(...(args as readonly unknown[])) }]),
  );
}

export type StandaloneOps = {
  [Name in keyof OpArgsMap & string]: (
    inputPath: string,
    outputPath: string,
    ...args: OpArgsMap[Name]
  ) => Promise<string>;
};

/**
 * Auto-generated standalone op functions.
 *
 * Any op file that calls {@link registerOp} immediately appears here with
 * full type safety, so adding a new op requires only that op file.
 */
export const standalone = new Proxy({} as Record<string, unknown>, {
  get: (_target, property) => {
    if (typeof property !== "string") return undefined;
    return (
      inputPath: string,
      outputPath: string,
      ...args: readonly unknown[]
    ) => {
      const build = OP_BUILDERS.get(property);
      if (!build) {
        return Promise.reject(new Error(`Unknown op '${property}'`));
      }
      return NativeOpenCV.runPipeline(
        inputPath,
        outputPath,
        JSON.stringify([{ type: property, ...build(...args) }]),
      );
    };
  },
}) as StandaloneOps;

/**
 * Register a pipeline op. Installs a fluent method named `name` on
 * {@link Pipeline} that maps its arguments to a params object via `build` and
 * enqueues `{ type: name, ...params }`.
 *
 * The method's public, typed signature is contributed by the op module itself
 * through `declare module "../core/pipeline"` interface merging, which is why
 * this orchestrator never changes as ops are added.
 *
 * @param name  Unique op name, matching the native handler key.
 * @param build Maps builder arguments to the serialized params. Defaults to a
 *              no-arg op with no params.
 */
export function registerOp<Args extends readonly unknown[] = []>(
  name: string,
  build: (...args: Args) => Record<string, unknown> = () => ({}),
): void {
  OP_BUILDERS.set(name, build as OpBuilder);
  (Pipeline.prototype as unknown as Record<string, unknown>)[name] = function (
    this: Pipeline,
    ...args: Args
  ): Pipeline {
    return this.enqueue({ type: name, ...build(...args) });
  };
}
