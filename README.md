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

| Operation          | Method / function                                                    | Parameters                                                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grayscale          | `gray()` (alias `toGray`)                                            | –                                                                                                                                                                                                                                                                                |
| Gaussian blur      | `gaussianBlur(kernelSize, sigmaX?)`                                  | `kernelSize`: positive odd int; `sigmaX`: default `0` (derived from kernel)                                                                                                                                                                                                      |
| Median blur        | `medianBlur(kernelSize)`                                             | `kernelSize`: positive odd int                                                                                                                                                                                                                                                   |
| Canny edges        | `canny(threshold1, threshold2)`                                      | lower/upper hysteresis thresholds                                                                                                                                                                                                                                                |
| Threshold          | `threshold(thresh, maxValue, thresholdType?)`                        | `thresholdType`: `"binary"` \| `"binaryInv"` \| `"trunc"` \| `"toZero"` \| `"toZeroInv"` (default `"binary"`)                                                                                                                                                                    |
| Resize             | `resize(width, height, interpolation?)`                              | `interpolation`: `"nearest"` \| `"linear"` \| `"cubic"` \| `"area"` (default `"linear"`)                                                                                                                                                                                         |
| Crop               | `crop(x, y, width, height)`                                          | rectangle must lie within image bounds                                                                                                                                                                                                                                           |
| Rotate             | `rotate(angle)`                                                      | `angle`: `90` \| `180` \| `270` (clockwise)                                                                                                                                                                                                                                      |
| Flip               | `flip(direction)`                                                    | `direction`: `"horizontal"` \| `"vertical"` \| `"both"`                                                                                                                                                                                                                          |
| Dilate             | `dilate(kernelSize, iterations?)`                                    | `kernelSize`: positive odd int; `iterations`: default `1`                                                                                                                                                                                                                        |
| Erode              | `erode(kernelSize, iterations?)`                                     | `kernelSize`: positive odd int; `iterations`: default `1`                                                                                                                                                                                                                        |
| Convert color      | `cvtColor(code)`                                                     | `code`: `"BGR2GRAY"` \| `"GRAY2BGR"` \| `"BGR2RGB"` \| `"RGB2BGR"` \| `"BGR2HSV"` \| `"HSV2BGR"` \| `"BGR2HLS"` \| `"HLS2BGR"` \| `"BGR2Lab"` \| `"Lab2BGR"` \| `"BGR2YCrCb"` \| `"YCrCb2BGR"`                                                                                   |
| In-range mask      | `inRange(lower, upper)`                                              | `lower`/`upper`: per-channel bounds (1–4 numbers, same length as the image's channel count); returns a single-channel binary mask                                                                                                                                                |
| Filter 2D          | `filter2D(kernel)`                                                   | `kernel`: a non-empty 2D number array (equal-length rows); arbitrary convolution that keeps the source depth/channels                                                                                                                                                            |
| Separable filter   | `sepFilter2D(kernelX, kernelY, delta?)`                              | apply 1D `kernelX` across rows and `kernelY` down columns (efficient rank-1 convolution); make one kernel `[1]` for a horizontal/vertical-only pass; `delta` added per pixel (default `0`); keeps source depth/channels                                                          |
| Sobel              | `sobel(dx, dy, ksize?, scale?, delta?)`                              | directional edge derivative; `dx`/`dy`: derivative order (`dx + dy ≥ 1`); `ksize`: odd `1 \| 3 \| 5 \| 7` (default `3`); `scale`/`delta` default `1`/`0`; returned as an absolute 8-bit image (`gray()` first for single-channel edges)                                          |
| Scharr             | `scharr(dx, dy, scale?, delta?)`                                     | more accurate 3×3 first-order derivative; exactly one of `dx`/`dy` is `1`, the other `0`; `scale`/`delta` default `1`/`0`; returned as an absolute 8-bit image                                                                                                                   |
| Laplacian          | `laplacian(ksize?, scale?, delta?)`                                  | isotropic second-derivative edge detector; `ksize`: odd `1 \| 3 \| 5 \| 7` (default `1`); `scale`/`delta` default `1`/`0`; returned as an absolute 8-bit image                                                                                                                   |
| Adaptive threshold | `adaptiveThreshold(maxValue, blockSize, c, method?, thresholdType?)` | `blockSize`: odd int ≥ 3; `c`: constant subtracted; `method`: `"mean"` \| `"gaussian"` (default `"gaussian"`); `thresholdType`: `"binary"` \| `"binaryInv"` (default `"binary"`); grayscaled first                                                                               |
| Morphology         | `morphologyEx(operation, kernelSize, iterations?)`                   | `operation`: `"open"` \| `"close"` \| `"gradient"` \| `"tophat"` \| `"blackhat"`; `kernelSize`: positive odd int; `iterations`: default `1`                                                                                                                                      |
| Bitwise not        | `bitwiseNot()`                                                       | inverts every pixel (`0 ↔ 255` on a mask)                                                                                                                                                                                                                                        |
| Apply mask         | `applyMask(build)`                                                   | `build(mask)`: a sub-pipeline that derives a single-channel mask from a copy of the current image; keeps the current pixels the mask selects and zeroes the rest                                                                                                                 |
| Draw rectangle     | `drawRect(x, y, width, height, options?)`                            | outline a box; `options`: `{ color?, thickness?, fillColor?, antialias? }` — `color`: stroke `[r, g, b]` 0–255 (default red); `thickness`: px ≥ 1 (default `2`); `fillColor`: optional `[r, g, b]` solid fill drawn under the stroke; `antialias`: smooth edges (default `true`) |
| Draw circle        | `drawCircle(centerX, centerY, radius, options?)`                     | outline a circle; `radius` > 0; `options`: `{ color?, thickness?, fillColor?, antialias? }` as above                                                                                                                                                                             |
| Draw line          | `drawLine(x1, y1, x2, y2, options?)`                                 | line segment between two points; `options`: `{ color?, thickness?, antialias? }` as above                                                                                                                                                                                        |
| Put text           | `putText(text, x, y, options?)`                                      | label at bottom-left `(x, y)`; `options`: `{ fontScale?, color?, thickness?, antialias? }` — `fontScale` > 0 (default `1`); rest as above                                                                                                                                        |
| Draw polygon       | `drawPolygon(points, options?)`                                      | polyline through `[x, y]` `points` (≥ 2); `options`: `{ color?, thickness?, closed?, fillColor?, antialias? }` — `closed`: connect last→first (default `true`); `fillColor`: optional `[r, g, b]` solid fill drawn under the stroke; rest as above                               |
| Warp perspective   | `warpPerspective(srcPoints, dstPoints, width?, height?)`             | map four `[x, y]` `srcPoints` onto four `dstPoints` (perspective transform — e.g. deskew a detected document); `width`/`height` default to the current image size                                                                                                                |
| Warp affine        | `warpAffine(srcPoints, dstPoints, width?, height?)`                  | map three `[x, y]` `srcPoints` onto three `dstPoints` (rotate / scale / shear / translate); `width`/`height` default to the current image size                                                                                                                                   |
| Blend              | `blend(source, alpha?, beta?, gamma?)`                               | weighted blend `out = alpha·current + beta·source + gamma`; `source`: file path or base64 image, decoded and resized to match; `alpha`/`beta` default `0.5`; `gamma` default `0`                                                                                                 |
| Equalize histogram | `equalizeHist()`                                                     | global histogram equalization; grayscaled first, returns single-channel                                                                                                                                                                                                          |
| CLAHE              | `clahe(clipLimit?, tileGridSize?)`                                   | contrast-limited adaptive histogram equalization; `clipLimit` default `2`; `tileGridSize` (square grid side) default `8`; grayscaled first                                                                                                                                       |
| Bilateral filter   | `bilateralFilter(diameter?, sigmaColor?, sigmaSpace?)`               | edge-preserving smoothing; `diameter` default `9`; `sigmaColor`/`sigmaSpace` default `75`                                                                                                                                                                                        |
| Copy make border   | `copyMakeBorder(top, bottom, left, right, options?)`                 | pad by margins; `options`: `{ borderType?, color? }` — `borderType`: `"constant"` (default) \| `"replicate"` \| `"reflect"` \| `"reflect101"` \| `"wrap"`; `color`: `[r, g, b]` used by `"constant"` (default black)                                                             |
| Normalize          | `normalize(alpha?, beta?, normType?)`                                | rescale intensities; `normType`: `"minmax"` (stretch to `[alpha, beta]`, default) \| `"l1"` \| `"l2"` \| `"inf"` (scale norm to `alpha`); `alpha` default `0`; `beta` default `255`                                                                                              |
| Convert scale abs  | `convertScaleAbs(alpha?, beta?)`                                     | brightness/contrast `out = \|alpha·current + beta\|`, 8-bit saturated; `alpha` default `1`; `beta` default `0`                                                                                                                                                                   |
| Lookup table       | `lut(map)`                                                           | per-pixel intensity remap (`cv::LUT`); `map`: a function `(x) => y` over `x = 0..255`, or a 256-entry table; outputs rounded and clamped to 0–255; the same table is applied to every channel (invert, gamma, posterize, solarize, custom curves)                                |
| Debug capture      | `debug(path)`                                                        | `path`: absolute file path; writes the current intermediate image (encoder from the extension) and passes it through unchanged                                                                                                                                                   |
| Scan document      | `scanDocument(options?)`                                             | `options.mode` `"color"`\|`"gray"`\|`"bw"`, `options.aspectRatio` (detects the largest document-like quad and returns a top-down, perspective-corrected crop)                                                                                                                    |

Analysis ops return structured data instead of an image and end the chain (no
`output()`/`run()`):

| Analysis op     | Method                   | Returns                                                                                                                                |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Decode QR       | `decodeQR()`             | `DecodeQRResult` — see [Structured results](#structured-results-analysis-ops)                                                          |
| Detect document | `detectDocument()`       | `DetectDocumentResult` — four document corners, see [Structured results](#structured-results-analysis-ops)                             |
| Find contours   | `findContours(options?)` | `FindContoursResult` — per-shape area, points, bounding box, min-area rect, see [Structured results](#structured-results-analysis-ops) |

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
  cvtColor,
  inRange,
  filter2D,
  adaptiveThreshold,
  morphologyEx,
  bitwiseNot,
  drawRect,
  drawCircle,
  drawLine,
  putText,
  drawPolygon,
  warpPerspective,
  warpAffine,
  blend,
  equalizeHist,
  clahe,
  bilateralFilter,
  copyMakeBorder,
  normalize,
  convertScaleAbs,
  lut,
  sobel,
  scharr,
  laplacian,
  sepFilter2D,
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
await cvtColor(input, output, "BGR2HSV");
await inRange(input, output, [35, 60, 60], [85, 255, 255]); // green mask
await filter2D(input, output, [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
]); // sharpen
await adaptiveThreshold(input, output, 255, 11, 2); // binarize uneven lighting
await morphologyEx(input, output, "open", 3); // denoise a mask
await bitwiseNot(input, output); // invert
await drawRect(input, output, 10, 10, 80, 60); // red box (default color)
await drawCircle(input, output, 50, 50, 20, { color: [0, 255, 0] }); // green circle
await drawCircle(input, output, 50, 50, 20, {
  color: [255, 255, 255],
  fillColor: [0, 255, 0],
}); // green disc, white border
await drawLine(input, output, 0, 0, 100, 100, { color: [0, 0, 255] }); // blue line
await putText(input, output, "hi", 10, 30, { color: [255, 255, 0] }); // yellow label
await drawPolygon(input, output, [
  [10, 10],
  [90, 20],
  [80, 90],
  [15, 80],
]); // outline a quad

// Geometric & photometric ops
await warpPerspective(
  input,
  output,
  [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ], // src quad
  [
    [10, 0],
    [90, 0],
    [100, 100],
    [0, 100],
  ], // dst quad
); // deskew / map a quad onto a quad (output size defaults to input)
await warpAffine(
  input,
  output,
  [
    [0, 0],
    [100, 0],
    [0, 100],
  ], // src triangle
  [
    [10, 0],
    [110, 0],
    [10, 100],
  ], // dst triangle → shear
);
await blend(input, output, "/abs/overlay.png", 0.7, 0.3, 0); // 70% input + 30% overlay
await equalizeHist(input, output); // global contrast (grayscale result)
await clahe(input, output, 3, 8); // adaptive contrast, clip 3, 8×8 tiles
await bilateralFilter(input, output, 9, 75, 75); // edge-preserving smooth
await copyMakeBorder(input, output, 10, 10, 10, 10, {
  borderType: "reflect101",
}); // pad 10px on every side
await normalize(input, output, 0, 255, "minmax"); // stretch to full 0–255 range
await convertScaleAbs(input, output, 1.2, 10); // brightness/contrast: |1.2·x + 10|
await lut(input, output, (x) => 255 - x); // invert via lookup table

// Gradients & edges
await sobel(input, output, 1, 0, 3); // ∂/∂x with a 3×3 kernel (absolute)
await scharr(input, output, 0, 1); // ∂/∂y, sharper 3×3 derivative
await laplacian(input, output, 3); // second-derivative edges, ksize 3
await sepFilter2D(input, output, [1, 0, -1], [1, 2, 1]); // separable Sobel-X
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

#### Inspecting intermediates with `debug()`

`debug(path)` is a pass-through tap: it writes the current intermediate image
to `path` and continues the chain unchanged, so you can inspect a multi-step
pipeline without splitting it into separate runs.

```ts
await pipeline()
  .input("/abs/in.png")
  .output("/abs/out.png")
  .gray()
  .debug("/abs/debug/after-gray.png")
  .canny(50, 150)
  .debug("/abs/debug/after-canny.png")
  .run();
```

The encoder is chosen from `path`'s extension (`.png`, `.jpg`, ...). It is a
side effect only — the image handed to the next step is identical to the one
before `debug`.

#### Masking with a sub-pipeline (`applyMask`)

`inRange` and `cvtColor` _produce_ masks, but on their own they replace the
image with the mask. `applyMask(build)` closes the loop: `build` receives a
fresh sub-pipeline that runs on a **copy** of the current image to derive a
single-channel mask, then the original image flows out with everything outside
the mask zeroed — segment-and-keep in a single pass.

```ts
await pipeline()
  .input("/abs/in.png")
  .output("/abs/out.png")
  // isolate green pixels, keeping them in full color
  .applyMask((mask) =>
    mask.cvtColor("BGR2HSV").inRange([35, 60, 60], [85, 255, 255]),
  )
  // clean up the result with morphology
  .run();
```

The sub-pipeline must yield a single-channel mask the same size as the current
image (chain only transform ops on it — there is no `input`/`output`/`run`).
Pair it with `morphologyEx` to denoise the mask before applying it.

#### Drawing & annotation

`drawRect`, `drawCircle`, `drawLine`, `drawPolygon`, and `putText` overlay
shapes and labels onto the current image and pass it on unchanged in size and
type — ideal for visualizing what an analysis op found. Styling is passed as a
single trailing `options` object. Colors are `[r, g, b]` (0–255); the default
stroke `color` is red. `drawRect`, `drawCircle`, and `drawPolygon` also accept
an optional `fillColor`: when given, the interior is solid-filled (using
OpenCV's fast scanline fill) with that color before the `color` outline is
stroked on top — so stroke and fill are independent. Every op accepts an
`antialias` flag (default `true`); pass `false` for hard, aliased edges. Pair
them with `detectDocument`/`decodeQR`: read the corners on a first pass, then
draw them on a second.

```ts
// outline a detected document and label it
const { found, corners } = await pipeline()
  .input("/abs/in.png")
  .detectDocument();

if (found) {
  await pipeline()
    .input("/abs/in.png")
    .output("/abs/out.png")
    .drawPolygon(
      corners.map(({ x, y }) => [x, y] as const),
      { color: [0, 255, 0], thickness: 3 },
    )
    .putText("document", corners[0].x, corners[0].y - 8, { color: [0, 255, 0] })
    .run();
}
```

> **Sizing on small images.** Coordinates, `thickness`, and `fontScale` are all
> in **absolute pixels**, so a stroke or label sized for a 1080p photo will swamp
> a 64×64 thumbnail (and vice-versa). Either scale these params to the image's
> dimensions, or `resize()` the image up to a comfortable working size before
> annotating. For example, on a 256-px canvas a `thickness` of `2–3` and a
> `fontScale` near `1.5` read well.

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

#### Output mode and aspect ratio

`scanDocument(options?)` accepts an optional `mode` and `aspectRatio`:

- `mode`: `"color"` (default), `"gray"`, or `"bw"`. The `"bw"` mode applies an
  adaptive threshold for a crisp black-and-white "scanned paper" look, ideal for
  printed text.
- `aspectRatio`: force the output to a fixed `width / height` ratio instead of
  inferring it from the detected edges (e.g. `Math.SQRT1_2` ≈ 0.707 for portrait
  A‑series paper). Must be positive.

```ts
// Crisp black-and-white scan, forced to A4 portrait proportions
await pipeline()
  .input(photo)
  .scanDocument({ mode: "bw", aspectRatio: Math.SQRT1_2 })
  .output(scan)
  .run();

// Standalone, grayscale
await scanDocument(photo, scan, { mode: "gray" });
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

#### Detect only (corners for a live overlay)

`detectDocument()` runs the **same** detector but returns the four document
corners _without_ warping — ideal for drawing a live edge overlay on a camera
preview, or for feeding the corners into your own crop. It is a terminal
analysis op (input only, no `output()`/`run()`), and a missing document is
**not** an error: it resolves with `{ found: false, corners: [] }`, which suits
per-frame use.

```ts
import {
  pipeline,
  type DetectDocumentResult,
} from "@nijatk/react-native-opencv-wrapper";

const doc: DetectDocumentResult = await pipeline()
  .inputBase64(frame.base64)
  .detectDocument();

if (doc.found) {
  // doc.corners are tl, tr, br, bl in pixels of a doc.width × doc.height image.
  // Scale them to your <Image>/preview size to draw an overlay:
  const sx = viewWidth / doc.width;
  const sy = viewHeight / doc.height;
  const points = doc.corners.map((c) => ({ x: c.x * sx, y: c.y * sy }));
}
```

The result shape is:

```ts
interface DetectDocumentResult {
  found: boolean; // true when a document-like quad was located
  corners: { x: number; y: number }[]; // tl, tr, br, bl (empty if not found)
  width: number; // px width of the analysed image (corner coordinate space)
  height: number; // px height of the analysed image
}
```

`findContours()` returns every contour with its area, points, bounding box, and
rotated min-area rect — ordered largest-area first. Treat the image as a binary
mask, so grayscale + threshold (or canny) first for clean shapes:

```ts
import {
  pipeline,
  type FindContoursResult,
} from "@nijatk/react-native-opencv-wrapper";

const shapes: FindContoursResult = await pipeline()
  .input("/abs/path/shapes.png")
  .gray()
  .threshold(128, 255)
  .findContours({ minArea: 100, epsilon: 0.02 });

for (const c of shapes.contours) {
  console.log(c.area, c.boundingBox, c.minAreaRect.angle);
}
```

`findContours(options?)` accepts:

- `mode`: `"external"` (default, outermost only) or `"list"` (every contour).
- `minArea`: discard contours below this area in px². Default `0`.
- `epsilon`: polygon-simplify factor of each perimeter (`approxPolyDP`); `0`
  (default) keeps raw points, `0.02` reduces shapes to corners.

The result shape is:

```ts
interface FindContoursResult {
  found: boolean; // true when ≥1 contour passed the minArea filter
  count: number; // number of contours returned
  contours: {
    area: number; // px²
    points: { x: number; y: number }[]; // boundary points
    boundingBox: { x: number; y: number; width: number; height: number };
    minAreaRect: {
      centerX: number;
      centerY: number;
      width: number;
      height: number;
      angle: number;
    };
  }[];
  width: number; // px width of the analysed image
  height: number; // px height of the analysed image
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
