import type { SerializedOp } from "./pipeline";

/**
 * Op types that are pure per-channel point transforms over 8-bit values, so a
 * run of them collapses exactly into a single `cv::LUT` pass:
 *
 * - `lut` carries its resolved 256-entry output table (`table`);
 * - `bitwiseNot` is the table `255 - x` (per channel), identical to a LUT.
 *
 * Fusing them is byte-exact because composition is plain integer indexing of
 * already-clamped 0–255 tables — there is no OpenCV rounding to reproduce.
 */
const POINT_OPS: ReadonlySet<string> = new Set(["lut", "bitwiseNot"]);

/** The identity table `[0, 1, 2, …, 255]`. */
function identityTable(): number[] {
  return Array.from({ length: 256 }, (_unused, x) => x);
}

/** True when `table` maps every 8-bit value to itself (a no-op LUT). */
function isIdentity(table: readonly number[]): boolean {
  for (let x = 0; x < 256; x++) {
    if (table[x] !== x) return false;
  }
  return true;
}

/**
 * Compose `op` after the running `table` (where `table[x]` is the output so far
 * for input `x`): the new table maps `x` to `op(table[x])`.
 */
function composePointOp(table: number[], op: SerializedOp): number[] {
  if (op.type === "bitwiseNot") {
    return table.map((y) => 255 - y);
  }
  // `lut`: forward each current output through the user's 256-entry table.
  const lut = op.table as number[];
  return table.map((y) => lut[y]!);
}

/**
 * Rewrite a pipeline's op list into an equivalent but cheaper one before it is
 * serialized to native. Every rule preserves the exact output image:
 *
 * - **Point-op fusion** — a run of two or more consecutive `lut`/`bitwiseNot`
 *   ops becomes a single `lut` (or is dropped entirely when it composes to the
 *   identity, e.g. two inversions), turning N full-image passes into one.
 * - **Grayscale de-duplication** — a run of consecutive `gray` ops collapses to
 *   one (`gray` is idempotent).
 *
 * A lone `lut` or `bitwiseNot` is left untouched, so nothing is converted or
 * reordered unless it strictly reduces work.
 *
 * @param ops The queued ops as built by the {@link Pipeline} chain.
 * @returns A new, equivalent op list (the input is not mutated).
 */
export function optimizePipeline(ops: readonly SerializedOp[]): SerializedOp[] {
  const result: SerializedOp[] = [];
  let i = 0;

  while (i < ops.length) {
    const op = ops[i]!;

    if (POINT_OPS.has(op.type)) {
      // Greedily consume the whole run of adjacent point ops and fold them
      // into one table.
      let table = identityTable();
      let j = i;
      while (j < ops.length && POINT_OPS.has(ops[j]!.type)) {
        table = composePointOp(table, ops[j]!);
        j++;
      }

      if (j - i === 1) {
        result.push(op); // a single point op: keep it verbatim
      } else if (!isIdentity(table)) {
        result.push({ type: "lut", table });
      }
      // A multi-op run that composes to the identity is a no-op: emit nothing.
      i = j;
      continue;
    }

    if (op.type === "gray") {
      result.push(op);
      i++;
      while (i < ops.length && ops[i]!.type === "gray") i++;
      continue;
    }

    result.push(op);
    i++;
  }

  return result;
}
