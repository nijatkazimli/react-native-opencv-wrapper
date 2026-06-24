# @nijatk/react-native-opencv-wrapper

React Native wrapper for OpenCV with optional bundled binaries.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nijatkazimli_react-native-opencv-wrapper&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nijatkazimli_react-native-opencv-wrapper)

## Install

```bash
npm install @nijatk/react-native-opencv-wrapper
```

or

```bash
yarn add @nijatk/react-native-opencv-wrapper
```

Then install native dependencies for iOS:

```bash
cd ios
pod install
```

## Compatibility

This package is a **TurboModule** and ships only a New Architecture
implementation (it relies on React Native Codegen). The **New Architecture must
be enabled** in your app — there is no legacy Paper / bridge fallback.

| Requirement           | Supported                                                                      |
| --------------------- | ------------------------------------------------------------------------------ |
| React Native          | **0.76+** recommended (New Architecture on by default); built/tested on `0.85` |
| React                 | **19+** (matches the React version bundled with RN 0.76+)                      |
| Architecture          | **New Architecture only** — TurboModules + Codegen required                    |
| Bridgeless mode       | Supported (and expected on RN 0.76+)                                           |
| iOS deployment target | Follows the OpenCV pod (iOS 13+)                                               |
| Android `minSdk`      | 24+                                                                            |

Notes:

- **New Architecture is mandatory.** On RN 0.76 and newer it is enabled by
  default. On older supported versions you must turn it on:
  - iOS: install pods with `RCT_NEW_ARCH_ENABLED=1 pod install`.
  - Android: set `newArchEnabled=true` in `android/gradle.properties`.
- If New Architecture is disabled, the native module will not be registered and
  calls will fail to resolve.
- Codegen runs automatically during the iOS `pod install` and the Android Gradle
  build — no manual codegen step is required.

## OpenCV integration

This package supports two OpenCV modes:

- `bundled` (default)
  - Android: depends on `org.opencv:opencv` from Maven Central.
  - iOS: depends on the `OpenCV` CocoaPod.
  - Use this when your app does not already provide OpenCV.

- `host`
  - Use this when the host app already provides OpenCV (for example via another pod or an Android Gradle module).
  - In this mode the wrapper does not declare its own OpenCV dependency.

### Android configuration

By default the Android build uses bundled OpenCV version `4.11.0`.

To use a host-provided OpenCV implementation:

```properties
# android/gradle.properties
rnOpenCVMode=host
```

Or set an environment variable:

```bash
export RN_OPENCV_MODE=host
```

To override the Android OpenCV version:

```properties
rnOpenCVVersion=4.11.0
```

### iOS configuration

For iOS the default mode is `bundled`, and the wrapper will depend on the `OpenCV` pod.

To force host mode, set one of these:

```bash
export RN_OPENCV_MODE=host
```

or in `package.json`:

```json
{
  "reactNativeOpenCV": {
    "mode": "host",
    "pod": "OpenCV",
    "version": "~> 4.3.0"
  }
}
```

If your Podfile already includes a pod whose name begins with `OpenCV`, the package will automatically switch to host mode.

## Usage

Every operation is available in two forms:

- **Standalone** — a one-shot function that reads the input, applies a single
  operation, and writes the output.
- **Pipeline** — chain multiple operations and run them in a single native
  pass (read once, transform in memory, write once).

All input/output arguments must be **absolute filesystem paths** (no `file://`
URIs), and every async call resolves with the output path.

### Operations

| Operation     | Method / function                             | Parameters                                                                                                    |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Grayscale     | `gray()` (alias `toGray`)                     | –                                                                                                             |
| Gaussian blur | `gaussianBlur(kernelSize, sigmaX?)`           | `kernelSize`: positive odd int; `sigmaX`: default `0` (derived from kernel)                                   |
| Median blur   | `medianBlur(kernelSize)`                      | `kernelSize`: positive odd int                                                                                |
| Canny edges   | `canny(threshold1, threshold2)`               | lower/upper hysteresis thresholds                                                                             |
| Threshold     | `threshold(thresh, maxValue, thresholdType?)` | `thresholdType`: `"binary"` \| `"binaryInv"` \| `"trunc"` \| `"toZero"` \| `"toZeroInv"` (default `"binary"`) |
| Resize        | `resize(width, height, interpolation?)`       | `interpolation`: `"nearest"` \| `"linear"` \| `"cubic"` \| `"area"` (default `"linear"`)                      |
| Crop          | `crop(x, y, width, height)`                   | rectangle must lie within image bounds                                                                        |
| Rotate        | `rotate(angle)`                               | `angle`: `90` \| `180` \| `270` (clockwise)                                                                   |
| Flip          | `flip(direction)`                             | `direction`: `"horizontal"` \| `"vertical"` \| `"both"`                                                       |
| Dilate        | `dilate(kernelSize, iterations?)`             | `kernelSize`: positive odd int; `iterations`: default `1`                                                     |
| Erode         | `erode(kernelSize, iterations?)`              | `kernelSize`: positive odd int; `iterations`: default `1`                                                     |
| Scan document | `scanDocument()`                              | – (detects the largest document-like quad and returns a top-down, perspective-corrected crop)                 |

Analysis ops return structured data instead of an image and end the chain (no
`output()`/`run()`):

| Analysis op | Method       | Returns                                                                       |
| ----------- | ------------ | ----------------------------------------------------------------------------- |
| Decode QR   | `decodeQR()` | `DecodeQRResult` — see [Structured results](#structured-results-analysis-ops) |

### Standalone

```ts
import {
  getOpenCVVersion,
  gray,
  gaussianBlur,
  medianBlur,
  canny,
  threshold,
  resize,
  crop,
  rotate,
  flip,
  dilate,
  erode,
} from "@nijatk/react-native-opencv-wrapper";

const input = "/abs/path/input.png";
const output = "/abs/path/output.png";

console.log("OpenCV version", getOpenCVVersion());

await gray(input, output);
await gaussianBlur(input, output, 7); // sigmaX defaults to 0
await medianBlur(input, output, 5);
await canny(input, output, 50, 150);
await threshold(input, output, 127, 255, "binary");
await resize(input, output, 320, 240, "area");
await crop(input, output, 10, 10, 100, 100);
await rotate(input, output, 90);
await flip(input, output, "horizontal");
await dilate(input, output, 3, 2);
await erode(input, output, 3);
```

> `toGray(input, output)` is kept as an alias of `gray(input, output)`.

### Pipeline

Chain several operations and execute them in a single native pass. A source
(`input()` or `inputBase64()`) and a sink (`output()` or `outputBase64()`) are
**required** — the types prevent you from calling `run()` until both are set,
so a missing source/sink is a compile-time error rather than a runtime failure.

```ts
import { pipeline } from "@nijatk/react-native-opencv-wrapper";

const outputPath = await pipeline()
  .input("/abs/path/input.png")
  .output("/abs/path/output.png")
  .resize(640, 480, "area")
  .gray()
  .gaussianBlur(5)
  .canny(50, 150)
  .run();
```

Use `clone()` to branch a shared base into independent variants without
re-running the earlier steps' configuration:

```ts
const base = pipeline().input("/abs/in.png").gray();

await base.clone().output("/abs/edges.png").canny(50, 150).run();
await base.clone().output("/abs/blurred.png").gaussianBlur(7).run();
```

### Base64 / in-memory I/O

To skip the disk entirely, source from a base64 string and/or return the result
as base64 instead of a file. This pairs naturally with image pickers and
network buffers, which already hand you base64.

`inputBase64()` accepts a raw base64 string or a full `data:` URI (the prefix is
stripped natively). `outputBase64(format?)` makes `run()` resolve with the
encoded image string (`format` defaults to `"png"`; `"jpg"`, `"jpeg"`, `"webp"`
and `"bmp"` are also supported).

```ts
// base64 in, file out
await pipeline()
  .inputBase64(pickedImage.base64) // or "data:image/png;base64,..."
  .output("/abs/path/output.png")
  .resize(640, 480)
  .gray()
  .run();

// file in, base64 out
const pngBase64 = await pipeline()
  .input("/abs/path/input.jpg")
  .outputBase64() // -> resolves with a base64 PNG string
  .canny(50, 150)
  .run();

// base64 in, base64 out (no filesystem touched)
const jpgBase64 = await pipeline()
  .inputBase64(srcBase64)
  .outputBase64("jpg")
  .resize(256, 256)
  .run();
```

`input()`/`inputBase64()` and `output()`/`outputBase64()` are interchangeable —
mix and match either source with either sink.

### Structured results (analysis ops)

Some operations return **data** rather than an image. These are _terminal_
analysis steps: they run any queued transform steps and then resolve with a
typed result, so only an input source is required (no `output()`/`run()`).

`decodeQR()` detects and decodes every QR code in the image:

```ts
import {
  pipeline,
  type DecodeQRResult,
} from "@nijatk/react-native-opencv-wrapper";

const result: DecodeQRResult = await pipeline()
  .input("/abs/path/photo.jpg")
  .decodeQR();

if (result.found) {
  for (const code of result.codes) {
    console.log(code.value); // decoded text payload
    console.log(code.corners); // [{ x, y }, ...] four corner points
  }
}
```

Transform steps may run before the analysis step (e.g. to crop or grayscale
first); they share the same single-pass engine, and the source can be a file or
base64:

```ts
const { found, codes } = await pipeline()
  .inputBase64(pickedImage.base64)
  .crop(0, 0, 512, 512)
  .gray()
  .decodeQR();
```

The result shape is:

```ts
interface DecodeQRResult {
  found: boolean; // true when at least one QR code was detected
  codes: {
    value: string; // decoded text ("" if located but not decodable)
    corners: { x: number; y: number }[]; // four corner points
  }[];
}
```

> **Requires OpenCV ≥ 4.3.0.** `decodeQR` uses
> `QRCodeDetector::detectAndDecodeMulti`, added in 4.3. The bundled OpenCV is
> always new enough; if you provide your own (see
> [OpenCV integration](#opencv-integration)) and it is older, the call
> rejects with the `opencv_unavailable` code.

### Document scanning

`scanDocument()` finds the largest document-like quadrilateral in the frame and
returns a top-down, perspective-corrected crop — a one-call "scan this receipt /
page / card" operation. It is an ordinary transform op, so it ends with
`output()`/`run()` (or use the standalone helper):

```ts
import { pipeline, scanDocument } from "@nijatk/react-native-opencv-wrapper";

// Fluent pipeline
await pipeline().input(photo).scanDocument().output(scan).run();

// Standalone
await scanDocument(photo, scan);
```

If no document-like quadrilateral is found, the call rejects with the
`opencv_document_not_found` code:

```ts
try {
  await scanDocument(photo, scan);
} catch (e) {
  if (e.code === "opencv_document_not_found") {
    // ask the user to retake the photo with the whole page in frame
  }
}
```

### Dynamic single ops

`standaloneOps` exposes every registered op by name (fully typed), and
`runStandaloneOp` runs one op with op-name inference — handy when the op is
chosen at runtime:

```ts
import {
  standaloneOps,
  runStandaloneOp,
} from "@nijatk/react-native-opencv-wrapper";

await standaloneOps.rotate(input, output, 180);
await runStandaloneOp("threshold", input, output, 127, 255, "toZero");
```

## Error handling

Every async call rejects with a stable `code` you can branch on, plus a
human-readable message:

| Code                        | Meaning                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `opencv_invalid_argument`   | Missing/invalid parameter, out-of-range value, or unknown enum                                                                                                    |
| `opencv_io_error`           | Could not read the input or write the output image                                                                                                                |
| `opencv_unknown_op`         | A pipeline referenced an op `type` with no registered handler                                                                                                     |
| `opencv_document_not_found` | `scanDocument` could not find a document-like quadrilateral in the image                                                                                          |
| `opencv_unavailable`        | OpenCV is missing a required capability: the native library failed to initialize, or a host-provided OpenCV is too old for the op (e.g. `decodeQR` needs ≥ 4.3.0) |
| `opencv_error`              | Unexpected / uncategorized native error                                                                                                                           |

```ts
try {
  await crop(input, output, 0, 0, 99999, 99999);
} catch (e) {
  if (e.code === "opencv_invalid_argument") {
    // handle bad parameters
  }
}
```

### Notes

- All input/output paths must be absolute filesystem paths. Do not use `file://` URIs.
- Supported image formats follow OpenCV's read/write support (PNG, JPG, BMP, etc.).
- Kernel sizes (`gaussianBlur`, `medianBlur`, `dilate`, `erode`) must be positive odd integers.
- An unrecognized enum value (e.g. an unknown `thresholdType`) rejects with `opencv_invalid_argument`; omit the argument to use the documented default.

## Example

The repository includes a working example app at `example/`.

## Roadmap & limitations

This wrapper covers a focused set of image-processing operations, with file or
base64 sources and sinks. Known gaps and planned improvements:

**Current limitations**

- **No raw bitmap / texture I/O.** Sources and sinks are file paths or base64
  strings (see [Base64 / in-memory I/O](#base64--in-memory-io)). There is no
  zero-copy bitmap or GPU texture input/output, so interop with other native
  modules still goes through a file or a base64 round-trip.
- **No live camera / frame processing.** There is no frame processor or
  per-frame API; this is not a replacement for camera-stream vision pipelines.
- **Single-image ops.** No multi-image inputs (blending, stitching, template
  matching) or video decoding/encoding.
- **Fixed op set.** Only the operations listed above are exposed. Custom kernels,
  arbitrary OpenCV calls, and color-space conversions beyond grayscale are not
  available without adding a new op (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- **Few analysis ops.** Structured results are supported (see
  [Structured results](#structured-results-analysis-ops)), but `decodeQR` is the
  only analysis op so far; detectors like contours, histograms, feature points,
  and face detection are not exposed yet.
- **Limited parameter surface.** Things like border types, anchor points,
  kernel shapes (only square), and per-channel control are not exposed.
- **No cancellation or progress.** Long pipelines run to completion; there is no
  way to cancel an in-flight call.

**Planned / nice-to-have**

- More analysis ops returning structured data (contours, histograms, feature
  points, face detection).
- More operations: color conversions, morphology shapes, warp/perspective,
  adaptive threshold, bitwise ops.
- Optional output encoding controls (JPG quality, PNG compression).
- A typed escape hatch for running an arbitrary sequence of raw OpenCV steps.
- Broader automated testing across both platforms and OpenCV versions.

Contributions are welcome — adding an operation is intentionally lightweight and
documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
