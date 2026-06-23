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
  },
}));

const native = NativeOpenCV as jest.Mocked<typeof NativeOpenCV>;

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
    expect(native.runPipeline).toHaveBeenCalledTimes(1);

    const [input, output, opsJson] = native.runPipeline.mock.calls[0];
    expect(input).toBe("/abs/in.png");
    expect(output).toBe("/abs/out.png");
    expect(JSON.parse(opsJson)).toEqual([
      { type: "resize", width: 640, height: 480, interpolation: "area" },
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
  });

  it("applies documented parameter defaults", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .resize(100, 100) // interpolation -> "linear"
      .gaussianBlur(7) // sigmaX -> 0
      .dilate(3) // iterations -> 1
      .run();

    const ops = JSON.parse(native.runPipeline.mock.calls[0][2]);
    expect(ops).toEqual([
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

    const ops = JSON.parse(native.runPipeline.mock.calls[0][2]);
    expect(ops).toEqual([
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
    expect(native.runPipeline).not.toHaveBeenCalled();
  });

  it("clone() produces an independent op list that does not affect the base", async () => {
    const base = pipeline().input("/in.png").gray();

    await base.clone().output("/edges.png").canny(50, 150).run();
    await base.clone().output("/blur.png").gaussianBlur(7).run();

    expect(native.runPipeline).toHaveBeenCalledTimes(2);

    const first = JSON.parse(native.runPipeline.mock.calls[0][2]);
    const second = JSON.parse(native.runPipeline.mock.calls[1][2]);

    expect(first).toEqual([
      { type: "gray" },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
    expect(second).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 7, sigmaX: 0 },
    ]);
    expect(native.runPipeline.mock.calls[0][1]).toBe("/edges.png");
    expect(native.runPipeline.mock.calls[1][1]).toBe("/blur.png");
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

    const ops = JSON.parse(native.runPipeline.mock.calls[0][2]);
    expect(ops).toEqual([
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
