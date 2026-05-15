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

```ts
import {
  getOpenCVVersion,
  toGray,
  gaussianBlur,
  canny,
} from "@nijatk/react-native-opencv-wrapper";

const inputPath = "/path/to/input.png";
const outputPath = "/path/to/output.png";

const version = getOpenCVVersion();
console.log("OpenCV version", version);

await toGray(inputPath, outputPath);
await gaussianBlur(inputPath, outputPath, 7, 0);
await canny(inputPath, outputPath, 50, 150);
```

### Notes

- All input/output paths must be absolute filesystem paths. Do not use `file://` URIs.
- Supported image formats follow OpenCV's read/write support (PNG, JPG, BMP, etc.).
- `gaussianBlur` requires `kernelSize` to be a positive odd integer.

## Example

The repository includes a working example app at `example/`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
