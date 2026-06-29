# Contributing

This guide explains how the package is structured and, in detail, **how to add
a new OpenCV operation** across all three layers.

## Architecture overview

Each operation is a small, self-contained module on three layers:

| Layer      | Location                      | Responsibility                               |
| ---------- | ----------------------------- | -------------------------------------------- |
| TypeScript | `src/ops/<name>.ts`           | Public, typed builder + standalone signature |
| iOS        | `ios/pipeline/ops/<Name>.mm`  | Native handler (Objective-C++ / OpenCV)      |
| Android    | `android/.../ops/<Name>Op.kt` | Native handler (Kotlin / OpenCV)             |

All three are wired through a **registry** and run by a single pipeline engine
that reads the input once, applies each queued op in memory, and writes the
output once:

- TS orchestrator: `src/core/pipeline.ts` (`registerOp`, `Pipeline`, `pipeline()`)
- iOS orchestrator: `ios/pipeline/OpenCVOpRegistry.{h,mm}`
- Android orchestrator: `android/.../ops/OpRegistry.kt`

Pipeline ops travel to native as JSON via the existing `runPipeline` bridge
method, so **adding an op does not touch the TurboModule spec
(`src/NativeReactNativeOpencvWrapper.ts`) or the codegen.** You only add op
files and, where noted, one registry line.

## Adding a new operation

We'll add an `invert` op (color inversion, `cv::bitwise_not`) as a worked
example. It takes no parameters; parameterized ops are covered in the notes.

### 1. TypeScript — `src/ops/invert.ts`

Create the op file. It uses [declaration merging] to contribute a typed method
to `Pipeline` and an entry to `OpArgsMap`, then registers the runtime builder.

```ts
import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    invert: [];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /** Queue a color inversion (`cv::bitwise_not`). */
    invert(): Pipeline<Input, Output>;
  }
}

// Powers the generated docs site (see "Documentation" below). The export is
// named `<id>Doc` so the `export *` barrel never collides, and it is stripped
// from the published build.
export const invertDoc: OpDoc = {
  name: "Invert",
  category: "masking-bitwise",
  kind: "image",
  method: "invert(): Pipeline",
  standalone: "invert(input, output)",
  desc: "Invert every pixel (`cv::bitwise_not`).",
  params: [],
  notes: null,
};

registerOp("invert");
```

Then register the module by adding one line to `src/ops/index.ts`:

```ts
export * from "./invert";
```

That single import makes `invert` available everywhere:

- `pipeline().input(...).output(...).invert().run()`
- `standaloneOps.invert(input, output)`
- `runStandaloneOp("invert", input, output)`

If you want a named standalone wrapper too (like `gray`/`resize`), add one to
`src/standalone.ts`:

```ts
/** Standalone wrapper for `invert`. */
export function invert(inputPath: string, outputPath: string): Promise<string> {
  return runStandaloneOp("invert", inputPath, outputPath);
}
```

### 2. iOS — `ios/pipeline/ops/Invert.mm`

Create the handler. `OPENCV_REGISTER_OP` self-registers the op at image-load
time via a `+load` method, and the podspec's `ios/**/*.{h,m,mm,...}` glob picks
up the new file automatically — **no registry edit needed.** (The podspec adds
`-ObjC` to consuming app targets so these registrar classes survive static
linking; without it the linker would drop unreferenced op object files.)

```objc
#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(invert, @"invert",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat dst;
    cv::bitwise_not(current, dst);
    return dst;
});
```

The op name (`@"invert"`) **must** match the TS `type` (`"invert"`).

### 3. Android — `android/.../ops/InvertOp.kt`

Create the handler implementing `Op`:

```kotlin
package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

object InvertOp : Op {
  override val name = "invert"
  override fun apply(current: Mat, params: JSONObject): Mat =
    Mat().also { Core.bitwise_not(current, it) }
}
```

Then add it to the `ops` list in `android/.../ops/OpRegistry.kt` (Android does
not auto-register):

```kotlin
private val ops: Map<String, Op> = listOf(
  GrayOp,
  // ...existing ops...
  InvertOp,
).associateBy { it.name }
```

## Parameters, validation, and error codes

Keep both native handlers behaving identically. Read parameters from the op's
JSON object and validate at the boundary.

**Naming:** the keys you read natively must match the object returned by the
op's `registerOp` builder. For a parameterized op:

```ts
registerOp("brightness", (delta: number) => ({ delta }));
```

reads `params[@"delta"]` (iOS) / `params.getDouble("delta")` (Android).

**Validation helpers** — prefer these so failures map to stable rejection codes
(see the Error handling table in the [README](README.md)):

| Concern                 | iOS                                                    | Android                                                     |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Required numeric params | `OpenCVRequireNumbers(params, @[@"delta"], error)`     | `params.getInt(...)` / `getDouble(...)` (throws on missing) |
| Invalid argument        | `*error = OpenCVMakeError(@"...")` then `return Mat()` | `require(cond) { "..." }` or `invalidArg("...")`            |
| Optional string / enum  | `OpenCVOptionalString(params, @"mode")`                | `params.optString("mode")`                                  |
| Unknown enum value      | reject (don't silently default)                        | `else -> invalidArg("...")` (don't silently default)        |

Optional enums should treat **absent/empty as the documented default** but
**reject an unrecognized value**, on both platforms.

### Memory (Android only)

Kotlin `Mat`s are not GC-managed for their native buffers. The orchestrator
releases the previous `current` after each step, but inside an op you must
release any temporary `Mat` you allocate (e.g. a structuring element). Return a
**new** `Mat` for the result; returning the same instance signals a no-op and
the orchestrator will skip releasing it. iOS relies on `cv::Mat` RAII and needs
no manual release.

## Documentation

The docs site at
<https://nijatkazimli.github.io/react-native-opencv-wrapper/> is **generated
from the op files** — there is no separate prose to keep in sync. Every op
module exports a `<id>Doc` constant typed as [`OpDoc`](src/ops/docTypes.ts):

| Field        | Notes                                                                |
| ------------ | -------------------------------------------------------------------- |
| `name`       | Display name shown on the card.                                      |
| `category`   | Must match a category `id` in `scripts/docs-meta.mjs`.               |
| `kind`       | `"image"` for transform ops, `"data"` for analysis ops.              |
| `method`     | The method signature, e.g. `invert(): Pipeline`.                     |
| `standalone` | The standalone signature string, or `null` (analysis ops have none). |
| `desc`       | One- or two-sentence description.                                    |
| `params`     | One entry per parameter: `{ name, type, req, def, desc }`.           |
| `returns`    | Data ops only — a string describing the resolved result shape.       |
| `notes`      | Optional caveat string, or `null`.                                   |

Regenerate `docs/data.js` after editing:

```bash
npm run docs:gen
```

Notes:

- If your op needs a **new category**, add it to the `categories` array in
  `scripts/docs-meta.mjs` (its order there sets the render order).
- These `doc` constants are **stripped from the published npm build** by the
  post-build step, so they never reach consumers.
- The site deploys automatically on a release tag — no manual deploy needed.

## Testing your op

After adding the three files (+ registry lines):

```bash
# TypeScript types + lint
npm run typecheck
npm run lint

# Run the example app
cd example
npm run ios      # or: npm run android
```

Exercise the op from `example/src/App.tsx` (standalone and inside a pipeline)
and confirm the output image renders.

## Checklist

- [ ] `src/ops/<name>.ts` created (declaration merge + `registerOp` + `<name>Doc`)
- [ ] `src/ops/index.ts` exports the new module
- [ ] (optional) standalone wrapper added to `src/standalone.ts`
- [ ] `ios/pipeline/ops/<Name>.mm` created with `OPENCV_REGISTER_OP`
- [ ] `android/.../ops/<Name>Op.kt` created and added to `OpRegistry.ops`
- [ ] Native op name matches the TS `type`
- [ ] Params validated identically on both platforms
- [ ] `<name>Doc` exported and any new category added to `scripts/docs-meta.mjs`
- [ ] `npm run docs:gen` run to regenerate `docs/data.js`

[declaration merging]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
