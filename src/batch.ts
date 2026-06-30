import {
  pipeline,
  type ImageFormat,
  type PipelineRecipe,
  type ReadyPipeline,
  type SerializedOp,
} from "./core/pipeline";

/**
 * Where a batch item reads its source image from: an absolute filesystem path
 * (shorthand string) or an in-memory base64 string.
 */
export type BatchSource = string | { base64: string };

/**
 * Where a batch item writes its result: an absolute filesystem path (shorthand
 * string) or a base64 string encoded with the given {@link ImageFormat}.
 */
export type BatchSink = string | { base64: ImageFormat };

/** One image to process in a {@link runBatch} call. */
export interface BatchItem {
  /** Source image for this item. */
  input: BatchSource;
  /** Destination for this item's processed result. */
  output: BatchSink;
}

/** Options controlling how a {@link runBatch} call executes. */
export interface BatchOptions {
  /**
   * Maximum number of items processed concurrently. Defaults to the number of
   * items (all at once). Lower it to cap peak memory when processing many
   * large images. Values below 1 are treated as 1.
   */
  concurrency?: number;
}

/**
 * Outcome of a single batch item, mirroring `Promise.allSettled` semantics so
 * one failing image never rejects the whole batch. `index` is the item's
 * position in the input array.
 */
export type BatchResult =
  | { index: number; status: "fulfilled"; output: string }
  | { index: number; status: "rejected"; error: Error };

/** Build a ready-to-run pipeline that applies `recipe` to a single item. */
function buildItem(
  recipe: PipelineRecipe | readonly SerializedOp[],
  item: BatchItem,
): ReadyPipeline {
  const sourced =
    typeof item.input === "string"
      ? pipeline().apply(recipe).input(item.input)
      : pipeline().apply(recipe).inputBase64(item.input.base64);
  return typeof item.output === "string"
    ? sourced.output(item.output)
    : sourced.outputBase64(item.output.base64);
}

/**
 * Apply one {@link PipelineRecipe} (or raw op array) across many images. Each
 * item runs the same steps with its own input/output, so a single shared
 * recipe or preset can process a whole folder.
 *
 * Items are processed with bounded concurrency and never reject the batch:
 * the returned array (in input order) reports each item's success or failure
 * individually, like `Promise.allSettled`.
 *
 * @example
 * const results = await runBatch(presets.edges, [
 *   { input: "/abs/a.jpg", output: "/abs/a.png" },
 *   { input: "/abs/b.jpg", output: "/abs/b.png" },
 * ]);
 * const failed = results.filter((r) => r.status === "rejected");
 */
export async function runBatch(
  recipe: PipelineRecipe | readonly SerializedOp[],
  items: readonly BatchItem[],
  options: BatchOptions = {},
): Promise<BatchResult[]> {
  const { concurrency = items.length } = options;
  const results: BatchResult[] = [];
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      try {
        const output = await buildItem(recipe, items[index]!).run();
        results[index] = { index, status: "fulfilled", output };
      } catch (error) {
        results[index] = { index, status: "rejected", error: error as Error };
      }
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
