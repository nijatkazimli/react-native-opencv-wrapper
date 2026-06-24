import NativeOpenCV from "../NativeReactNativeOpencvWrapper";
import { pipeline } from "../index";

jest.mock("../NativeReactNativeOpencvWrapper", () => ({
  __esModule: true,
  default: {
    getOpenCVVersion: jest.fn(() => "4.11.0"),
    toGray: jest.fn((_i: string, o: string) => Promise.resolve(o)),
    gaussianBlur: jest.fn((_i: string, o: string) => Promise.resolve(o)),
    canny: jest.fn((_i: string, o: string) => Promise.resolve(o)),
    runPipeline: jest.fn((_i: string, o: string) => Promise.resolve(o)),
    runPipelineIO: jest.fn((_inputJson: string, outputJson: string) => {
      const sink = JSON.parse(outputJson) as
        | { kind: "path"; value: string }
        | { kind: "base64"; ext: string };
      return Promise.resolve(
        sink.kind === "path" ? sink.value : `base64:${sink.ext}`,
      );
    }),
  },
}));

const native = NativeOpenCV as jest.Mocked<typeof NativeOpenCV>;

/** Parse the input/output/ops args of the Nth runPipelineIO call. */
function ioCall(n = 0) {
  const [inputJson, outputJson, opsJson] = native.runPipelineIO.mock.calls[n];
  return {
    input: JSON.parse(inputJson),
    output: JSON.parse(outputJson),
    ops: JSON.parse(opsJson),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Pipeline builder", () => {
  it("serializes queued ops to JSON in order and resolves with the output path", async () => {
    const result = await pipeline()
      .input("/abs/in.png")
      .output("/abs/out.png")
      .resize(640, 480, "area")
      .gray()
      .gaussianBlur(5)
      .canny(50, 150)
      .run();

    expect(result).toBe("/abs/out.png");
    expect(native.runPipelineIO).toHaveBeenCalledTimes(1);

    const { input, output, ops } = ioCall();
    expect(input).toEqual({ kind: "path", value: "/abs/in.png" });
    expect(output).toEqual({ kind: "path", value: "/abs/out.png" });
    expect(ops).toEqual([
      { type: "resize", width: 640, height: 480, interpolation: "area" },
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
  });

  it("accepts a base64 source via inputBase64", async () => {
    await pipeline()
      .inputBase64("data:image/png;base64,QUJD")
      .output("/abs/out.png")
      .gray()
      .run();

    const { input, output } = ioCall();
    expect(input).toEqual({
      kind: "base64",
      value: "data:image/png;base64,QUJD",
    });
    expect(output).toEqual({ kind: "path", value: "/abs/out.png" });
  });

  it("returns a base64 string via outputBase64 with the chosen format", async () => {
    const result = await pipeline()
      .input("/abs/in.png")
      .outputBase64("jpg")
      .gray()
      .run();

    expect(result).toBe("base64:.jpg");
    const { input, output } = ioCall();
    expect(input).toEqual({ kind: "path", value: "/abs/in.png" });
    expect(output).toEqual({ kind: "base64", ext: ".jpg" });
  });

  it("defaults outputBase64 to png", async () => {
    await pipeline().input("/abs/in.png").outputBase64().gray().run();
    expect(ioCall().output).toEqual({ kind: "base64", ext: ".png" });
  });

  it("supports base64 in and base64 out together", async () => {
    const result = await pipeline()
      .inputBase64("QUJD")
      .outputBase64("webp")
      .canny(10, 20)
      .run();

    expect(result).toBe("base64:.webp");
    const { input, output } = ioCall();
    expect(input).toEqual({ kind: "base64", value: "QUJD" });
    expect(output).toEqual({ kind: "base64", ext: ".webp" });
  });

  it("applies documented parameter defaults", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .resize(100, 100) // interpolation -> "linear"
      .gaussianBlur(7) // sigmaX -> 0
      .dilate(3) // iterations -> 1
      .run();

    expect(ioCall().ops).toEqual([
      { type: "resize", width: 100, height: 100, interpolation: "linear" },
      { type: "gaussianBlur", kernelSize: 7, sigmaX: 0 },
      { type: "dilate", kernelSize: 3, iterations: 1 },
    ]);
  });

  it("applies op-builder defaults for threshold and erode", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .threshold(127, 255) // thresholdType -> "binary"
      .erode(3) // iterations -> 1
      .run();

    expect(ioCall().ops).toEqual([
      {
        type: "threshold",
        thresh: 127,
        maxValue: 255,
        thresholdType: "binary",
      },
      { type: "erode", kernelSize: 3, iterations: 1 },
    ]);
  });

  it("rejects when no steps are queued", async () => {
    await expect(
      pipeline().input("/in.png").output("/out.png").run(),
    ).rejects.toThrow("Pipeline: no steps queued");
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });

  it("clone() produces an independent op list that does not affect the base", async () => {
    const base = pipeline().input("/in.png").gray();

    await base.clone().output("/edges.png").canny(50, 150).run();
    await base.clone().output("/blur.png").gaussianBlur(7).run();

    expect(native.runPipelineIO).toHaveBeenCalledTimes(2);

    const first = ioCall(0);
    const second = ioCall(1);

    expect(first.ops).toEqual([
      { type: "gray" },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
    expect(second.ops).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 7, sigmaX: 0 },
    ]);
    expect(first.output).toEqual({ kind: "path", value: "/edges.png" });
    expect(second.output).toEqual({ kind: "path", value: "/blur.png" });
  });

  it("clone() copies the input/output descriptors without sharing them", async () => {
    const base = pipeline().inputBase64("QUJD").output("/seed.png").gray();

    await base.clone().output("/a.png").run();
    await base.clone().outputBase64("png").run();

    expect(ioCall(0).input).toEqual({ kind: "base64", value: "QUJD" });
    expect(ioCall(0).output).toEqual({ kind: "path", value: "/a.png" });
    expect(ioCall(1).input).toEqual({ kind: "base64", value: "QUJD" });
    expect(ioCall(1).output).toEqual({ kind: "base64", ext: ".png" });
  });

  it("clone() of a pipeline with no input/output yet stays independent", async () => {
    const base = pipeline().gray();

    const result = await base.clone().input("/in.png").output("/out.png").run();

    expect(result).toBe("/out.png");
    const { input, output, ops } = ioCall();
    expect(input).toEqual({ kind: "path", value: "/in.png" });
    expect(output).toEqual({ kind: "path", value: "/out.png" });
    expect(ops).toEqual([{ type: "gray" }]);
  });

  it("serializes every op type with the expected param shape", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .gray()
      .gaussianBlur(5, 1.5)
      .medianBlur(3)
      .canny(10, 20)
      .threshold(127, 255, "toZero")
      .resize(320, 240, "cubic")
      .crop(10, 20, 100, 100)
      .rotate(270)
      .flip("both")
      .dilate(3, 2)
      .erode(5, 3)
      .run();

    expect(ioCall().ops).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 1.5 },
      { type: "medianBlur", kernelSize: 3 },
      { type: "canny", threshold1: 10, threshold2: 20 },
      {
        type: "threshold",
        thresh: 127,
        maxValue: 255,
        thresholdType: "toZero",
      },
      { type: "resize", width: 320, height: 240, interpolation: "cubic" },
      { type: "crop", x: 10, y: 20, width: 100, height: 100 },
      { type: "rotate", angle: 270 },
      { type: "flip", direction: "both" },
      { type: "dilate", kernelSize: 3, iterations: 2 },
      { type: "erode", kernelSize: 5, iterations: 3 },
    ]);
  });
});
