import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import {
  canny,
  gaussianBlur,
  getOpenCVVersion,
  toGray,
} from '@nijatk/react-native-opencv-wrapper';

// A tiny built-in test image (64x64 RGB checkerboard, base64-encoded PNG) so
// the example needs no extra assets / camera permissions.
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeUlEQVR42u3XsQ2AMAxFwYRpPIzH9TgeJguEigIiLmWU5qQv0JsRMXanqrb3mfmp99c4/AAAAAC8e2Z3H/G9v3tvQgAAAADP/gN6wIQAAAD0gB4wIQAAAD2gB0wIAABAD+gBEwIAANADesCEAAAA9IAeMCEAAIDfABbGnWCpH4DNoAAAAABJRU5ErkJggg==';

const dir = RNFS.CachesDirectoryPath;
const inputPath = `${dir}/sample.png`;

async function ensureSampleImage() {
  // Always overwrite — base64 contents may have changed across app updates,
  // and a stale corrupt copy would silently break every op.
  await RNFS.writeFile(inputPath, SAMPLE_PNG_BASE64, 'base64');
}

type Result = { label: string; path: string };

export default function App() {
  const [version, setVersion] = useState<string>('?');
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setVersion(getOpenCVVersion());
    } catch (e) {
      setError(`getOpenCVVersion failed: ${(e as Error).message}`);
    }
    ensureSampleImage().catch((e) =>
      setError(`sample image: ${(e as Error).message}`)
    );
  }, []);

  const run = useCallback(
    async (
      label: string,
      op: (input: string, output: string) => Promise<string>
    ) => {
      try {
        const output = `${dir}/out-${label}-${Date.now()}.png`;
        const path = await op(inputPath, output);
        setResults((r) => [{ label, path }, ...r]);
      } catch (e) {
        setError(`${label}: ${(e as Error).message}`);
      }
    },
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>react-native-opencv-wrapper</Text>
      <Text style={styles.mono}>OpenCV version: {version}</Text>
      <Text style={styles.mono}>Platform: {Platform.OS}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.row}>
        <Button label="To Gray" onPress={() => run('gray', toGray)} />
        <Button
          label="Blur"
          onPress={() => run('blur', (i, o) => gaussianBlur(i, o, 7, 0))}
        />
        <Button
          label="Canny"
          onPress={() => run('canny', (i, o) => canny(i, o, 50, 150))}
        />
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
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
  error: { color: 'red' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: {
    backgroundColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: { color: 'white', fontWeight: '600' },
  resultBlock: { gap: 4, marginTop: 12 },
  path: { fontSize: 11, color: '#666' },
  image: { width: 200, height: 200, backgroundColor: '#eee' },
});
