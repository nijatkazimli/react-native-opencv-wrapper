import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RNFS from "react-native-fs";
import {
  getOpenCVVersion,
  pipeline,
  type ReadyPipeline,
} from "@nijatk/react-native-opencv-wrapper";
import { SAMPLE_QR_PNG_BASE64 } from "./qrSample";
import { SAMPLE_DOCUMENT_PHOTO_BASE64 } from "./documentSample";

// A tiny built-in test image (64x64 RGB checkerboard, base64-encoded PNG) so
// the example needs no extra assets / camera permissions.
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeUlEQVR42u3XsQ2AMAxFwYRpPIzH9TgeJguEigIiLmWU5qQv0JsRMXanqrb3mfmp99c4/AAAAAC8e2Z3H/G9v3tvQgAAAADP/gN6wIQAAAD0gB4wIQAAAD2gB0wIAABAD+gBEwIAANADesCEAAAA9IAeMCEAAIDfABbGnWCpH4DNoAAAAABJRU5ErkJggg==";

const DIR = RNFS.CachesDirectoryPath;
const INPUT_PATH = `${DIR}/sample.png`;

// Fixed on-screen size of every result image (see styles.image).
const IMAGE_W = 200;
const IMAGE_H = 260;

async function ensureSampleImage() {
  // Always overwrite — base64 contents may have changed across app updates,
  // and a stale corrupt copy would silently break every op.
  await RNFS.writeFile(INPUT_PATH, SAMPLE_PNG_BASE64, "base64");
}

/** A named demo: a function that adds ops to a ready pipeline. */
type Demo = { label: string; configure: (p: ReadyPipeline) => ReadyPipeline };

const DEMOS: readonly Demo[] = [
  { label: "Gray", configure: (p) => p.gray() },
  { label: "Blur", configure: (p) => p.gaussianBlur(7) },
  { label: "Canny", configure: (p) => p.gray().canny(50, 150) },
  { label: "Resize", configure: (p) => p.resize(128, 128, "area") },
  { label: "Rotate", configure: (p) => p.rotate(90) },
  { label: "Flip", configure: (p) => p.flip("horizontal") },
  { label: "Crop", configure: (p) => p.crop(8, 8, 48, 48) },
  {
    label: "Threshold",
    configure: (p) => p.gray().threshold(127, 255, "binary"),
  },
  { label: "Median", configure: (p) => p.medianBlur(5) },
  { label: "Dilate", configure: (p) => p.gray().dilate(3) },
  { label: "Erode", configure: (p) => p.gray().erode(3) },
  { label: "Cvt HSV", configure: (p) => p.cvtColor("BGR2HSV") },
  {
    label: "In-Range",
    configure: (p) => p.inRange([0, 0, 0], [110, 110, 110]),
  },
  {
    label: "Sharpen",
    configure: (p) =>
      p.filter2D([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ]),
  },
  {
    label: "Adaptive",
    configure: (p) => p.adaptiveThreshold(255, 15, 5),
  },
  {
    label: "Morph Open",
    configure: (p) =>
      p.gray().threshold(127, 255, "binary").morphologyEx("open", 3),
  },
  { label: "Invert", configure: (p) => p.bitwiseNot() },
  {
    label: "Mask Keep",
    configure: (p) =>
      p.applyMask((mask) => mask.inRange([0, 0, 0], [110, 110, 110])),
  },
  {
    label: "Box",
    configure: (p) => p.resize(256, 256, "area").drawRect(40, 40, 176, 176),
  },
  {
    label: "Fill Box",
    configure: (p) =>
      p
        .resize(256, 256, "area")
        .drawRect(40, 40, 176, 176, [255, 255, 255], 3, [0, 200, 255]),
  },
  {
    label: "Circle",
    configure: (p) =>
      p.resize(256, 256, "area").drawCircle(128, 128, 96, [0, 200, 255]),
  },
  {
    label: "Disc",
    configure: (p) =>
      p
        .resize(256, 256, "area")
        .drawCircle(128, 128, 96, [255, 255, 255], 3, [0, 200, 255]),
  },
  {
    label: "Label",
    configure: (p) =>
      p
        .resize(256, 256, "area")
        .putText("hello", 24, 140, 1.6, [255, 255, 0], 3),
  },
  {
    label: "Polygon",
    configure: (p) =>
      p.resize(256, 256, "area").drawPolygon(
        [
          [128, 24],
          [232, 104],
          [192, 232],
          [64, 232],
          [24, 104],
        ],
        [255, 0, 200],
        3,
      ),
  },
  {
    label: "Fill Poly",
    configure: (p) =>
      p.resize(256, 256, "area").drawPolygon(
        [
          [128, 24],
          [232, 104],
          [192, 232],
          [64, 232],
          [24, 104],
        ],
        [255, 255, 255],
        3,
        true,
        [255, 0, 200],
      ),
  },
  {
    label: "Pipeline",
    configure: (p) =>
      p.resize(128, 128, "area").gray().gaussianBlur(7).canny(50, 150),
  },
];

type Result = {
  id: string;
  label: string;
  uri: string;
  note: string;
  compareUri?: string;
  captions?: { left: string; right: string };
};

export default function App() {
  const [version, setVersion] = useState<string>("?");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setVersion(getOpenCVVersion());
    } catch (e) {
      setError(`getOpenCVVersion failed: ${(e as Error).message}`);
    }
    ensureSampleImage().catch((e) =>
      setError(`sample image: ${(e as Error).message}`),
    );
  }, []);

  const runDemo = useCallback(async ({ label, configure }: Demo) => {
    try {
      const outputPath = `${DIR}/out-${label}-${Date.now()}.png`;
      const base = pipeline().input(INPUT_PATH).output(outputPath);
      const path = await configure(base).run();
      setResults((r) => [
        { id: path, label, uri: `file://${path}`, note: path },
        ...r,
      ]);
    } catch (e) {
      setError(`${label}: ${(e as Error).message}`);
    }
  }, []);

  const runBase64Demo = useCallback(async () => {
    try {
      const outBase64 = await pipeline()
        .inputBase64(SAMPLE_PNG_BASE64)
        .outputBase64("png")
        .gray()
        .canny(50, 150)
        .run();
      setResults((r) => [
        {
          id: `b64-${Date.now()}`,
          label: "Base64 \u2192 Base64",
          uri: `data:image/png;base64,${outBase64}`,
          note: `base64 string (${outBase64.length} chars)`,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`Base64: ${(e as Error).message}`);
    }
  }, []);

  const runDebugDemo = useCallback(async () => {
    try {
      const ts = Date.now();
      const debugPath = `${DIR}/debug-gray-${ts}.png`;
      const outputPath = `${DIR}/debug-out-${ts}.png`;
      // `debug()` taps the chain after `gray()`, writing the intermediate to a
      // file, then continues to `canny()` which produces the final output.
      const path = await pipeline()
        .input(INPUT_PATH)
        .output(outputPath)
        .gray()
        .debug(debugPath)
        .canny(50, 150)
        .run();
      setResults((r) => [
        {
          id: path,
          label: "debug() tap",
          uri: `file://${path}`,
          compareUri: `file://${debugPath}`,
          captions: { left: "debug: after gray", right: "final: canny" },
          note: `intermediate captured at ${debugPath}`,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`debug(): ${(e as Error).message}`);
    }
  }, []);

  const runDecodeQRDemo = useCallback(async () => {
    try {
      const result = await pipeline()
        .inputBase64(SAMPLE_QR_PNG_BASE64)
        .decodeQR();
      const note = result.found
        ? `found ${result.codes.length}: ${result.codes
            .map((c) => c.value)
            .join(", ")}`
        : "no QR code found";
      setResults((r) => [
        {
          id: `qr-${Date.now()}`,
          label: "Decode QR",
          uri: `data:image/png;base64,${SAMPLE_QR_PNG_BASE64}`,
          note,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`Decode QR: ${(e as Error).message}`);
    }
  }, []);

  const runScanDocumentDemo = useCallback(async () => {
    try {
      const outBase64 = await pipeline()
        .inputBase64(SAMPLE_DOCUMENT_PHOTO_BASE64)
        .outputBase64("png")
        .scanDocument()
        .run();
      setResults((r) => [
        {
          id: `scan-${Date.now()}`,
          label: "Scan Document",
          uri: `data:image/png;base64,${outBase64}`,
          compareUri: `data:image/jpeg;base64,${SAMPLE_DOCUMENT_PHOTO_BASE64}`,
          note: `rectified document (${outBase64.length} chars)`,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`Scan Document: ${(e as Error).message}`);
    }
  }, []);

  const runScanBwDemo = useCallback(async () => {
    try {
      const outBase64 = await pipeline()
        .inputBase64(SAMPLE_DOCUMENT_PHOTO_BASE64)
        .outputBase64("png")
        .scanDocument({ mode: "bw" })
        .run();
      setResults((r) => [
        {
          id: `scanbw-${Date.now()}`,
          label: "Scan Document (B&W)",
          uri: `data:image/png;base64,${outBase64}`,
          compareUri: `data:image/jpeg;base64,${SAMPLE_DOCUMENT_PHOTO_BASE64}`,
          note: `black & white scan (${outBase64.length} chars)`,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`Scan B&W: ${(e as Error).message}`);
    }
  }, []);

  const runDetectDocumentDemo = useCallback(async () => {
    try {
      const doc = await pipeline()
        .inputBase64(SAMPLE_DOCUMENT_PHOTO_BASE64)
        .detectDocument();
      if (!doc.found) {
        setResults((r) => [
          {
            id: `detect-${Date.now()}`,
            label: "Detect Document",
            uri: `data:image/jpeg;base64,${SAMPLE_DOCUMENT_PHOTO_BASE64}`,
            note: "no document found",
          },
          ...r,
        ]);
        return;
      }
      // Annotate the detected quad and its corners natively with drawPolygon /
      // drawCircle, scaling the stroke to the image so it stays visible.
      const points = doc.corners.map(
        ({ x, y }) => [Math.round(x), Math.round(y)] as const,
      );
      const thickness = Math.max(
        2,
        Math.round(Math.max(doc.width, doc.height) / 200),
      );
      let annotated = pipeline()
        .inputBase64(SAMPLE_DOCUMENT_PHOTO_BASE64)
        .outputBase64("png")
        .drawPolygon(points, [57, 255, 20], thickness);
      for (const [x, y] of points) {
        annotated = annotated.drawCircle(
          x,
          y,
          thickness * 3,
          [255, 0, 0],
          thickness,
          [255, 0, 0],
        );
      }
      const outBase64 = await annotated.run();
      setResults((r) => [
        {
          id: `detect-${Date.now()}`,
          label: "Detect Document",
          uri: `data:image/png;base64,${outBase64}`,
          compareUri: `data:image/jpeg;base64,${SAMPLE_DOCUMENT_PHOTO_BASE64}`,
          captions: { left: "original", right: "detected" },
          note: `corners (in ${doc.width}\u00d7${doc.height}): ${points
            .map(([x, y]) => `(${x},${y})`)
            .join(" ")}`,
        },
        ...r,
      ]);
    } catch (e) {
      setError(`Detect Document: ${(e as Error).message}`);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>react-native-opencv-wrapper</Text>
      <Text style={styles.mono}>OpenCV version: {version}</Text>
      <Text style={styles.mono}>Platform: {Platform.OS}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.row}>
        {DEMOS.map((demo) => (
          <Button
            key={demo.label}
            label={demo.label}
            onPress={() => runDemo(demo)}
          />
        ))}
        <Button label="Base64 I/O" onPress={runBase64Demo} />
        <Button label="debug() tap" onPress={runDebugDemo} />
        <Button label="Decode QR" onPress={runDecodeQRDemo} />
        <Button label="Scan Document" onPress={runScanDocumentDemo} />
        <Button label="Scan B&W" onPress={runScanBwDemo} />
        <Button label="Detect Document" onPress={runDetectDocumentDemo} />
      </View>

      {results.map((r) => (
        <View key={r.id} style={styles.resultBlock}>
          <Text style={styles.mono}>{r.label}</Text>
          <Text style={styles.path}>{r.note}</Text>
          {r.compareUri ? (
            <View style={styles.compareRow}>
              <View style={styles.compareCell}>
                <Text style={styles.caption}>
                  {r.captions?.left ?? "Original"}
                </Text>
                <Image source={{ uri: r.compareUri }} style={styles.image} />
              </View>
              <View style={styles.compareCell}>
                <Text style={styles.caption}>
                  {r.captions?.right ?? "Scanned"}
                </Text>
                <Image source={{ uri: r.uri }} style={styles.image} />
              </View>
            </View>
          ) : (
            <Image source={{ uri: r.uri }} style={styles.image} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function Button({
  label,
  onPress,
}: Readonly<{ label: string; onPress: () => void }>) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "600" },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
  error: { color: "red" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  button: {
    backgroundColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: { color: "white", fontWeight: "600" },
  resultBlock: { gap: 4, marginTop: 12 },
  path: { fontSize: 11, color: "#666" },
  image: {
    width: IMAGE_W,
    height: IMAGE_H,
    backgroundColor: "#eee",
    resizeMode: "contain",
  },
  compareRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  compareCell: { gap: 4 },
  caption: { fontSize: 12, fontWeight: "600", color: "#444" },
});
