import NativeOpenCV from "../NativeReactNativeOpencvWrapper";
import {
  getOpenCVVersion,
  toGray,
  gaussianBlur,
  canny,
  gray,
  resize,
  crop,
  rotate,
  flip,
  threshold,
  medianBlur,
  dilate,
  erode,
  scanDocument,
  cvtColor,
  inRange,
  filter2D,
  adaptiveThreshold,
  morphologyEx,
  bitwiseNot,
  standaloneOps,
  runStandaloneOp,
} from "../standalone";

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

/** Parse the ops JSON from the n-th runPipeline call. */
function opsOf(callIndex = 0): unknown {
  return JSON.parse(native.runPipeline.mock.calls[callIndex][2]);
}

describe("getOpenCVVersion", () => {
  it("returns the native version string", () => {
    expect(getOpenCVVersion()).toBe("4.11.0");
    expect(native.getOpenCVVersion).toHaveBeenCalledTimes(1);
  });
});

describe("direct native standalone functions", () => {
  it("toGray forwards to the native method", async () => {
    await toGray("/in.png", "/out.png");
    expect(native.toGray).toHaveBeenCalledWith("/in.png", "/out.png");
    expect(native.runPipeline).not.toHaveBeenCalled();
  });

  it("gaussianBlur defaults sigmaX to 0", async () => {
    await gaussianBlur("/in.png", "/out.png", 7);
    expect(native.gaussianBlur).toHaveBeenCalledWith(
      "/in.png",
      "/out.png",
      7,
      0,
    );
  });

  it("gaussianBlur forwards an explicit sigmaX", async () => {
    await gaussianBlur("/in.png", "/out.png", 7, 2.5);
    expect(native.gaussianBlur).toHaveBeenCalledWith(
      "/in.png",
      "/out.png",
      7,
      2.5,
    );
  });

  it("canny forwards both thresholds", async () => {
    await canny("/in.png", "/out.png", 50, 150);
    expect(native.canny).toHaveBeenCalledWith("/in.png", "/out.png", 50, 150);
  });
});

describe("pipeline-backed standalone wrappers", () => {
  it("gray runs a single gray op", async () => {
    const result = await gray("/in.png", "/out.png");
    expect(result).toBe("/out.png");
    expect(native.runPipeline).toHaveBeenCalledWith(
      "/in.png",
      "/out.png",
      expect.any(String),
    );
    expect(opsOf()).toEqual([{ type: "gray" }]);
  });

  it("resize defaults interpolation to linear", async () => {
    await resize("/in.png", "/out.png", 320, 240);
    expect(opsOf()).toEqual([
      { type: "resize", width: 320, height: 240, interpolation: "linear" },
    ]);
  });

  it("crop serializes the rectangle", async () => {
    await crop("/in.png", "/out.png", 10, 20, 100, 200);
    expect(opsOf()).toEqual([
      { type: "crop", x: 10, y: 20, width: 100, height: 200 },
    ]);
  });

  it("rotate serializes the angle", async () => {
    await rotate("/in.png", "/out.png", 90);
    expect(opsOf()).toEqual([{ type: "rotate", angle: 90 }]);
  });

  it("flip serializes the direction", async () => {
    await flip("/in.png", "/out.png", "vertical");
    expect(opsOf()).toEqual([{ type: "flip", direction: "vertical" }]);
  });

  it("threshold defaults thresholdType to binary", async () => {
    await threshold("/in.png", "/out.png", 127, 255);
    expect(opsOf()).toEqual([
      {
        type: "threshold",
        thresh: 127,
        maxValue: 255,
        thresholdType: "binary",
      },
    ]);
  });

  it("medianBlur serializes the kernel size", async () => {
    await medianBlur("/in.png", "/out.png", 5);
    expect(opsOf()).toEqual([{ type: "medianBlur", kernelSize: 5 }]);
  });

  it("dilate defaults iterations to 1", async () => {
    await dilate("/in.png", "/out.png", 3);
    expect(opsOf()).toEqual([{ type: "dilate", kernelSize: 3, iterations: 1 }]);
  });

  it("erode forwards an explicit iterations count", async () => {
    await erode("/in.png", "/out.png", 3, 4);
    expect(opsOf()).toEqual([{ type: "erode", kernelSize: 3, iterations: 4 }]);
  });

  it("erode defaults iterations to 1", async () => {
    await erode("/in.png", "/out.png", 3);
    expect(opsOf()).toEqual([{ type: "erode", kernelSize: 3, iterations: 1 }]);
  });

  it("scanDocument runs a single scanDocument op", async () => {
    const result = await scanDocument("/in.png", "/out.png");
    expect(result).toBe("/out.png");
    expect(opsOf()).toEqual([{ type: "scanDocument" }]);
  });

  it("scanDocument forwards the output mode", async () => {
    await scanDocument("/in.png", "/out.png", { mode: "bw" });
    expect(opsOf()).toEqual([{ type: "scanDocument", mode: "bw" }]);
  });

  it("scanDocument forwards an aspect-ratio hint", async () => {
    await scanDocument("/in.png", "/out.png", { aspectRatio: 0.7 });
    expect(opsOf()).toEqual([{ type: "scanDocument", aspectRatio: 0.7 }]);
  });

  it("cvtColor serializes the conversion code", async () => {
    await cvtColor("/in.png", "/out.png", "BGR2HSV");
    expect(opsOf()).toEqual([{ type: "cvtColor", code: "BGR2HSV" }]);
  });

  it("inRange serializes the lower and upper bounds", async () => {
    await inRange("/in.png", "/out.png", [0, 0, 0], [180, 255, 255]);
    expect(opsOf()).toEqual([
      { type: "inRange", lower: [0, 0, 0], upper: [180, 255, 255] },
    ]);
  });

  it("filter2D serializes the kernel", async () => {
    await filter2D("/in.png", "/out.png", [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ]);
    expect(opsOf()).toEqual([
      {
        type: "filter2D",
        kernel: [
          [0, -1, 0],
          [-1, 5, -1],
          [0, -1, 0],
        ],
      },
    ]);
  });

  it("adaptiveThreshold defaults method and thresholdType", async () => {
    await adaptiveThreshold("/in.png", "/out.png", 255, 11, 2);
    expect(opsOf()).toEqual([
      {
        type: "adaptiveThreshold",
        maxValue: 255,
        blockSize: 11,
        c: 2,
        method: "gaussian",
        thresholdType: "binary",
      },
    ]);
  });

  it("adaptiveThreshold forwards explicit method and thresholdType", async () => {
    await adaptiveThreshold(
      "/in.png",
      "/out.png",
      200,
      9,
      -3,
      "mean",
      "binaryInv",
    );
    expect(opsOf()).toEqual([
      {
        type: "adaptiveThreshold",
        maxValue: 200,
        blockSize: 9,
        c: -3,
        method: "mean",
        thresholdType: "binaryInv",
      },
    ]);
  });

  it("morphologyEx defaults iterations to 1", async () => {
    await morphologyEx("/in.png", "/out.png", "open", 3);
    expect(opsOf()).toEqual([
      { type: "morphologyEx", operation: "open", kernelSize: 3, iterations: 1 },
    ]);
  });

  it("morphologyEx forwards an explicit iterations count", async () => {
    await morphologyEx("/in.png", "/out.png", "close", 5, 2);
    expect(opsOf()).toEqual([
      {
        type: "morphologyEx",
        operation: "close",
        kernelSize: 5,
        iterations: 2,
      },
    ]);
  });

  it("bitwiseNot runs a single bitwiseNot op", async () => {
    await bitwiseNot("/in.png", "/out.png");
    expect(opsOf()).toEqual([{ type: "bitwiseNot" }]);
  });
});

describe("standaloneOps proxy", () => {
  it("exposes every registered op by name", async () => {
    await standaloneOps.rotate("/in.png", "/out.png", 180);
    expect(opsOf()).toEqual([{ type: "rotate", angle: 180 }]);
  });

  it("rejects for an unknown op name", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (standaloneOps as any).notAnOp("/in.png", "/out.png"),
    ).rejects.toThrow("Unknown op 'notAnOp'");
    expect(native.runPipeline).not.toHaveBeenCalled();
  });

  it("returns undefined for non-string (symbol) property access", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((standaloneOps as any)[Symbol.iterator]).toBeUndefined();
  });
});

describe("runStandaloneOp", () => {
  it("runs a named op with inferred args", async () => {
    await runStandaloneOp(
      "threshold",
      "/in.png",
      "/out.png",
      127,
      255,
      "toZero",
    );
    expect(opsOf()).toEqual([
      {
        type: "threshold",
        thresh: 127,
        maxValue: 255,
        thresholdType: "toZero",
      },
    ]);
  });

  it("rejects for an unknown op name", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runStandaloneOp("nope" as any, "/in.png", "/out.png"),
    ).rejects.toThrow("Unknown op 'nope'");
    expect(native.runPipeline).not.toHaveBeenCalled();
  });
});
