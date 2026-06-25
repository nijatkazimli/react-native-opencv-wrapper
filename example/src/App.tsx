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

// Fixed on-screen size of every result image (see styles.image). The corner
// overlay maps detector coordinates onto this box, accounting for the
// letterboxing introduced by `resizeMode: "contain"`.
const IMAGE_W = 200;
const IMAGE_H = 260;
const DOT = 12;
const OVERLAY_COLOR = "#39FF14";

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
    label: "Pipeline",
    configure: (p) =>
      p.resize(128, 128, "area").gray().gaussianBlur(7).canny(50, 150),
  },
];

type Corner = { x: number; y: number };
type DetectOverlay = { corners: Corner[]; width: number; height: number };

type Result = {
  id: string;
  label: string;
  uri: string;
  note: string;
  compareUri?: string;
  captions?: { left: string; right: string };
  overlay?: DetectOverlay;
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
      const note = doc.found
        ? `corners (in ${doc.width}\u00d7${doc.height}): ${doc.corners
            .map((c) => `(${Math.round(c.x)},${Math.round(c.y)})`)
            .join(" ")}`
        : "no document found";
      setResults((r) => [
        {
          id: `detect-${Date.now()}`,
          label: "Detect Document",
          uri: `data:image/jpeg;base64,${SAMPLE_DOCUMENT_PHOTO_BASE64}`,
          note,
          overlay: doc.found
            ? { corners: doc.corners, width: doc.width, height: doc.height }
            : undefined,
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
          ) : r.overlay ? (
            <View style={styles.overlayWrap}>
              <Image source={{ uri: r.uri }} style={styles.overlayImage} />
              <CornerOverlay overlay={r.overlay} />
            </View>
          ) : (
            <Image source={{ uri: r.uri }} style={styles.image} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Draw the four detected document corners (dots + connecting edges) over the
 * original image. Detector coordinates live in a `width \u00d7 height` space, so we
 * map them onto the on-screen image rect, accounting for the letterbox padding
 * that `resizeMode: "contain"` adds inside the fixed IMAGE_W \u00d7 IMAGE_H box.
 */
function CornerOverlay({ overlay }: Readonly<{ overlay: DetectOverlay }>) {
  const { corners, width, height } = overlay;
  if (corners.length < 4) return null;

  const scale = Math.min(IMAGE_W / width, IMAGE_H / height);
  const offX = (IMAGE_W - width * scale) / 2;
  const offY = (IMAGE_H - height * scale) / 2;
  const pts = corners.map((c) => ({
    x: offX + c.x * scale,
    y: offY + c.y * scale,
  }));
  const edges = [
    [pts[0], pts[1]],
    [pts[1], pts[2]],
    [pts[2], pts[3]],
    [pts[3], pts[0]],
  ];

  return (
    <View style={styles.overlay} pointerEvents="none">
      {edges.map(([a, b], i) => {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        return (
          <View
            key={`edge-${i}`}
            style={[
              styles.edge,
              {
                left: (a.x + b.x) / 2 - len / 2,
                top: (a.y + b.y) / 2 - 1,
                width: len,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}
      {pts.map((p, i) => (
        <View
          key={`corner-${i}`}
          style={[styles.dot, { left: p.x - DOT / 2, top: p.y - DOT / 2 }]}
        />
      ))}
    </View>
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
  overlayWrap: {
    position: "relative",
    width: IMAGE_W,
    height: IMAGE_H,
    alignSelf: "flex-start",
    backgroundColor: "#eee",
  },
  overlayImage: { ...StyleSheet.absoluteFill, resizeMode: "contain" },
  overlay: { ...StyleSheet.absoluteFill },
  edge: {
    position: "absolute",
    height: 2,
    backgroundColor: OVERLAY_COLOR,
  },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: OVERLAY_COLOR,
    borderWidth: 1,
    borderColor: "#000",
  },
});
