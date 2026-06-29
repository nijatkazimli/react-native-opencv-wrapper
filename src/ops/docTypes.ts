/**
 * Types for the structured documentation metadata co-located with every op.
 *
 * Each op module exports a `doc: OpDoc` constant. The docs-site generator
 * (`scripts/gen-docs-data.mjs`) statically reads those constants to emit
 * `docs/data.js`, so the published documentation can never drift from the
 * source. These declarations are type-only and erase at runtime; the `doc`
 * constants themselves are stripped from the published build by
 * `scripts/strip-doc-exports.mjs`, so they add nothing to consumers' bundles.
 */

/** A single documented parameter of an op. */
export interface OpDocParam {
  /** Parameter name as written in the public signature. */
  name: string;
  /** TypeScript type rendered verbatim in the docs table. */
  type: string;
  /** Whether the parameter is required. */
  req: boolean;
  /** Default value shown when optional, or `null` when required. */
  def: string | null;
  /** Human-readable description. */
  desc: string;
}

/** Structured documentation for one operation. */
export interface OpDoc {
  /** Display name, e.g. `"Gaussian Blur"`. */
  name: string;
  /** Category id this op belongs to (see `scripts/docs-meta.mjs`). */
  category: string;
  /** `"image"` for transforms, `"data"` for analysis terminals. */
  kind: "image" | "data";
  /** Public method signature rendered verbatim. */
  method: string;
  /** Standalone one-shot usage, or `null` when the op is pipeline-only. */
  standalone: string | null;
  /** One-paragraph summary. */
  desc: string;
  /** Documented parameters in signature order. */
  params: OpDocParam[];
  /** Shape of the resolved value (data ops only). */
  returns?: string;
  /** Optional caveat shown in a callout. */
  notes: string | null;
}
