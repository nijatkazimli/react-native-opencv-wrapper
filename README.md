# @nijatk/react-native-opencv-wrapper

React Native (New Architecture) wrapper for OpenCV with optional bundled
binaries — 60+ image-processing and analysis operations, available as one-shot
functions or a fused single-pass pipeline.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nijatkazimli_react-native-opencv-wrapper&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nijatkazimli_react-native-opencv-wrapper)

📖 **[Full documentation & API reference →](https://nijatkazimli.github.io/react-native-opencv-wrapper/)**

The docs site covers every operation, its parameters, pipelines, base64 I/O,
structured analysis results, and error codes. This README keeps only the
essentials to get installed and running.

## Install

```bash
npm install @nijatk/react-native-opencv-wrapper
# or
yarn add @nijatk/react-native-opencv-wrapper
```

iOS — install the native pods:

```bash
cd ios && pod install
```

Rebuild your app after installing so the native module is linked.

## Requirements

This package is a **TurboModule** and requires React Native's **New
Architecture** (enabled by default on RN 0.76+). There is no legacy bridge
fallback — if the New Architecture is disabled, the native module will not
register.

- **React Native** 0.76+ (built/tested on 0.85) · **React** 19+
- **iOS** deployment target 13+ · **Android** `minSdk` 24+

## Quick start

```ts
import { gray, pipeline } from "@nijatk/react-native-opencv-wrapper";

// One-shot: read → transform → write
await gray("/abs/in.png", "/abs/out.png");

// Pipeline: chain ops, run in a single native pass
await pipeline()
  .input("/abs/in.png")
  .output("/abs/out.png")
  .resize(640, 480, "area")
  .gray()
  .gaussianBlur(5)
  .canny(50, 150)
  .run();
```

All I/O uses **absolute filesystem paths** (no `file://` URIs) or base64; every
async call resolves with the output, or rejects with a stable error `code`. See
the [documentation](https://nijatkazimli.github.io/react-native-opencv-wrapper/)
for the full API.

## Recipes & presets

A pipeline's steps are serializable data. Turn any pipeline into a portable,
source-agnostic **recipe**, then store it, send it over the network, or rebuild
it later:

```ts
import {
  pipeline,
  Pipeline,
  presets,
} from "@nijatk/react-native-opencv-wrapper";

// Apply a built-in preset (edges, crispScan, softenPortrait)
await pipeline()
  .input("/abs/in.jpg")
  .output("/abs/out.png")
  .apply(presets.edges)
  .run();

// Define your own reusable recipe (no input/output — works on any image)
const punch = pipeline()
  .clahe(2, 8)
  .convertScaleAbs(1.1, 10)
  .gaussianBlur(3)
  .toJSON();

// Persist and reload it
const json = JSON.stringify(punch);
await Pipeline.fromJSON(json).input("/abs/in.jpg").output("/abs/out.jpg").run();
```

`toJSON()` (also used by `JSON.stringify`) snapshots the ops; `apply()` splices a
recipe into any chain; `Pipeline.fromJSON()` rebuilds a runnable pipeline. See
the [Recipes & presets](https://nijatkazimli.github.io/react-native-opencv-wrapper/#recipes)
docs for details.

## Batch processing

Apply one recipe across many images in a single call with `runBatch`. Results
come back in input order and mirror `Promise.allSettled`, so one bad file never
fails the whole run:

```ts
import { runBatch, presets } from "@nijatk/react-native-opencv-wrapper";

const results = await runBatch(
  presets.edges,
  [
    { input: "/abs/a.jpg", output: "/abs/a.png" },
    { input: "/abs/b.jpg", output: "/abs/b.png" },
  ],
  { concurrency: 4 }, // optional: cap images in flight (defaults to all)
);

const failed = results.filter((r) => r.status === "rejected");
```

Inputs and outputs accept absolute paths or `{ base64 }` descriptors, so a
batch can run entirely in memory. See the
[Batch processing](https://nijatkazimli.github.io/react-native-opencv-wrapper/#batch)
docs for details.

## OpenCV integration

OpenCV ships **bundled** by default (Android `4.11.0` via Maven Central; iOS via
the `OpenCV` CocoaPod). Switch to **host** mode to use an OpenCV your app already
provides — in host mode the wrapper declares no OpenCV dependency of its own.

```properties
# android/gradle.properties
rnOpenCVMode=host          # use host-provided OpenCV
rnOpenCVVersion=4.11.0     # override the bundled Android version
```

```jsonc
// package.json (iOS host mode)
{
  "reactNativeOpenCV": {
    "mode": "host",
    "pod": "OpenCV",
    "version": "~> 4.3.0",
  },
}
```

You can also set `RN_OPENCV_MODE=host` in the environment. On iOS, if your
Podfile already includes a pod whose name begins with `OpenCV`, host mode is
selected automatically.

## Example

A working example app lives in [`example/`](example/).

## Contributing

Adding an operation is intentionally lightweight — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
