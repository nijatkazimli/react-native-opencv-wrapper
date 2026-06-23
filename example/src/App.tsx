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

// A tiny built-in test image (64x64 RGB checkerboard, base64-encoded PNG) so
// the example needs no extra assets / camera permissions.
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeUlEQVR42u3XsQ2AMAxFwYRpPIzH9TgeJguEigIiLmWU5qQv0JsRMXanqrb3mfmp99c4/AAAAAC8e2Z3H/G9v3tvQgAAAADP/gN6wIQAAAD0gB4wIQAAAD2gB0wIAABAD+gBEwIAANADesCEAAAA9IAeMCEAAIDfABbGnWCpH4DNoAAAAABJRU5ErkJggg==";

const DIR = RNFS.CachesDirectoryPath;
const INPUT_PATH = `${DIR}/sample.png`;

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
  {
    label: "Pipeline",
    configure: (p) =>
      p.resize(128, 128, "area").gray().gaussianBlur(7).canny(50, 150),
  },
];

type Result = { label: string; path: string };

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
      setResults((r) => [{ label, path }, ...r]);
    } catch (e) {
      setError(`${label}: ${(e as Error).message}`);
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
      </View>

      {results.map((r) => (
        <View key={r.path} style={styles.resultBlock}>
          <Text style={styles.mono}>{r.label}</Text>
          <Text style={styles.path}>{r.path}</Text>
          <Image source={{ uri: `file://${r.path}` }} style={styles.image} />
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
  image: { width: 200, height: 200, backgroundColor: "#eee" },
});
