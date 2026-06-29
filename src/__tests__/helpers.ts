import NativeOpenCV from "../NativeReactNativeOpencvWrapper";

export const native = NativeOpenCV as jest.Mocked<typeof NativeOpenCV>;

/** Parse the input/output/ops args of the Nth runPipelineIO call. */
export function ioCall(n = 0) {
  const [inputJson, outputJson, opsJson] = native.runPipelineIO.mock.calls[n]!;
  return {
    input: JSON.parse(inputJson),
    output: JSON.parse(outputJson),
    ops: JSON.parse(opsJson),
  };
}

/** Parse the input/ops args of the Nth runPipelineData call. */
export function dataCall(n = 0) {
  const [inputJson, opsJson] = native.runPipelineData.mock.calls[n]!;
  return {
    input: JSON.parse(inputJson),
    ops: JSON.parse(opsJson),
  };
}
