# @nijatk/react-native-opencv-wrapper

React Native wrapper for OpenCV with optional bundled binaries.

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

Chain several operations and execute them in a single native pass. `input()`
and `output()` are **required** — the types prevent you from calling `run()`
until both are set, so a missing path is a compile-time error rather than a
runtime failure.

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

| Code                      | Meaning                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `opencv_invalid_argument` | Missing/invalid parameter, out-of-range value, or unknown enum |
| `opencv_io_error`         | Could not read the input or write the output image             |
| `opencv_unknown_op`       | A pipeline referenced an op `type` with no registered handler  |
| `opencv_unavailable`      | OpenCV native library failed to initialize (Android)           |
| `opencv_error`            | Unexpected / uncategorized native error                        |

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
