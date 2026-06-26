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
  drawRect,
  drawCircle,
  drawLine,
  putText,
  drawPolygon,
  warpPerspective,
  warpAffine,
  blend,
  equalizeHist,
  clahe,
  bilateralFilter,
  copyMakeBorder,
  normalize,
  convertScaleAbs,
  lut,
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
  return JSON.parse(native.runPipeline.mock.calls[callIndex]![2]);
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

  it("drawRect defaults color and thickness", async () => {
    await drawRect("/in.png", "/out.png", 1, 2, 3, 4);
    expect(opsOf()).toEqual([
      {
        type: "drawRect",
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
    ]);
  });

  it("drawRect forwards explicit color, thickness, fillColor, and antialias", async () => {
    await drawRect("/in.png", "/out.png", 1, 2, 3, 4, {
      color: [10, 20, 30],
      thickness: 5,
      fillColor: [100, 110, 120],
      antialias: false,
    });
    expect(opsOf()).toEqual([
      {
        type: "drawRect",
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        color: [10, 20, 30],
        thickness: 5,
        fillColor: [100, 110, 120],
        antialias: false,
      },
    ]);
  });

  it("drawCircle defaults color and thickness", async () => {
    await drawCircle("/in.png", "/out.png", 5, 6, 7);
    expect(opsOf()).toEqual([
      {
        type: "drawCircle",
        centerX: 5,
        centerY: 6,
        radius: 7,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
    ]);
  });

  it("drawCircle forwards explicit color, thickness, fillColor, and antialias", async () => {
    await drawCircle("/in.png", "/out.png", 5, 6, 7, {
      color: [0, 255, 0],
      thickness: 4,
      fillColor: [44, 55, 66],
      antialias: false,
    });
    expect(opsOf()).toEqual([
      {
        type: "drawCircle",
        centerX: 5,
        centerY: 6,
        radius: 7,
        color: [0, 255, 0],
        thickness: 4,
        fillColor: [44, 55, 66],
        antialias: false,
      },
    ]);
  });

  it("drawLine defaults color and thickness", async () => {
    await drawLine("/in.png", "/out.png", 0, 0, 9, 9);
    expect(opsOf()).toEqual([
      {
        type: "drawLine",
        x1: 0,
        y1: 0,
        x2: 9,
        y2: 9,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
    ]);
  });

  it("drawLine forwards explicit color, thickness, and antialias", async () => {
    await drawLine("/in.png", "/out.png", 0, 0, 9, 9, {
      color: [0, 0, 255],
      thickness: 3,
      antialias: false,
    });
    expect(opsOf()).toEqual([
      {
        type: "drawLine",
        x1: 0,
        y1: 0,
        x2: 9,
        y2: 9,
        color: [0, 0, 255],
        thickness: 3,
        antialias: false,
      },
    ]);
  });

  it("putText defaults fontScale, color, and thickness", async () => {
    await putText("/in.png", "/out.png", "hi", 5, 6);
    expect(opsOf()).toEqual([
      {
        type: "putText",
        text: "hi",
        x: 5,
        y: 6,
        fontScale: 1,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
    ]);
  });

  it("putText forwards explicit fontScale, color, thickness, and antialias", async () => {
    await putText("/in.png", "/out.png", "hi", 5, 6, {
      fontScale: 2,
      color: [255, 255, 0],
      thickness: 3,
      antialias: false,
    });
    expect(opsOf()).toEqual([
      {
        type: "putText",
        text: "hi",
        x: 5,
        y: 6,
        fontScale: 2,
        color: [255, 255, 0],
        thickness: 3,
        antialias: false,
      },
    ]);
  });

  it("drawPolygon defaults color, thickness, closed, and fill", async () => {
    await drawPolygon("/in.png", "/out.png", [
      [0, 0],
      [1, 1],
    ]);
    expect(opsOf()).toEqual([
      {
        type: "drawPolygon",
        points: [
          [0, 0],
          [1, 1],
        ],
        color: [255, 0, 0],
        thickness: 2,
        closed: true,
        antialias: true,
      },
    ]);
  });

  it("drawPolygon forwards explicit color, thickness, closed, fillColor, and antialias", async () => {
    await drawPolygon(
      "/in.png",
      "/out.png",
      [
        [0, 0],
        [1, 1],
      ],
      {
        color: [9, 8, 7],
        thickness: 4,
        closed: false,
        fillColor: [12, 13, 14],
        antialias: false,
      },
    );
    expect(opsOf()).toEqual([
      {
        type: "drawPolygon",
        points: [
          [0, 0],
          [1, 1],
        ],
        color: [9, 8, 7],
        thickness: 4,
        closed: false,
        fillColor: [12, 13, 14],
        antialias: false,
      },
    ]);
  });

  it("warpPerspective serializes only the points when size is omitted", async () => {
    await warpPerspective(
      "/in.png",
      "/out.png",
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
      [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
      ],
    );
    expect(opsOf()).toEqual([
      {
        type: "warpPerspective",
        srcPoints: [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        dstPoints: [
          [0, 0],
          [20, 0],
          [20, 20],
          [0, 20],
        ],
      },
    ]);
  });

  it("warpPerspective forwards an explicit output size", async () => {
    await warpPerspective(
      "/in.png",
      "/out.png",
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ],
      200,
      100,
    );
    expect(opsOf()).toEqual([
      {
        type: "warpPerspective",
        srcPoints: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        dstPoints: [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
        width: 200,
        height: 100,
      },
    ]);
  });

  it("warpAffine serializes only the points when size is omitted", async () => {
    await warpAffine(
      "/in.png",
      "/out.png",
      [
        [0, 0],
        [10, 0],
        [0, 10],
      ],
      [
        [0, 0],
        [20, 0],
        [0, 20],
      ],
    );
    expect(opsOf()).toEqual([
      {
        type: "warpAffine",
        srcPoints: [
          [0, 0],
          [10, 0],
          [0, 10],
        ],
        dstPoints: [
          [0, 0],
          [20, 0],
          [0, 20],
        ],
      },
    ]);
  });

  it("warpAffine forwards an explicit output size", async () => {
    await warpAffine(
      "/in.png",
      "/out.png",
      [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [2, 0],
        [0, 2],
      ],
      300,
      150,
    );
    expect(opsOf()).toEqual([
      {
        type: "warpAffine",
        srcPoints: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        dstPoints: [
          [0, 0],
          [2, 0],
          [0, 2],
        ],
        width: 300,
        height: 150,
      },
    ]);
  });

  it("blend defaults alpha, beta, and gamma", async () => {
    await blend("/in.png", "/out.png", "/overlay.png");
    expect(opsOf()).toEqual([
      {
        type: "blend",
        source: "/overlay.png",
        alpha: 0.5,
        beta: 0.5,
        gamma: 0,
      },
    ]);
  });

  it("blend forwards explicit alpha, beta, and gamma", async () => {
    await blend("/in.png", "/out.png", "/overlay.png", 0.7, 0.3, 5);
    expect(opsOf()).toEqual([
      {
        type: "blend",
        source: "/overlay.png",
        alpha: 0.7,
        beta: 0.3,
        gamma: 5,
      },
    ]);
  });

  it("equalizeHist runs a single equalizeHist op", async () => {
    await equalizeHist("/in.png", "/out.png");
    expect(opsOf()).toEqual([{ type: "equalizeHist" }]);
  });

  it("clahe defaults clipLimit and tileGridSize", async () => {
    await clahe("/in.png", "/out.png");
    expect(opsOf()).toEqual([{ type: "clahe", clipLimit: 2, tileGridSize: 8 }]);
  });

  it("clahe forwards explicit clipLimit and tileGridSize", async () => {
    await clahe("/in.png", "/out.png", 3, 16);
    expect(opsOf()).toEqual([
      { type: "clahe", clipLimit: 3, tileGridSize: 16 },
    ]);
  });

  it("bilateralFilter defaults diameter and sigmas", async () => {
    await bilateralFilter("/in.png", "/out.png");
    expect(opsOf()).toEqual([
      { type: "bilateralFilter", diameter: 9, sigmaColor: 75, sigmaSpace: 75 },
    ]);
  });

  it("bilateralFilter forwards explicit diameter and sigmas", async () => {
    await bilateralFilter("/in.png", "/out.png", 5, 50, 60);
    expect(opsOf()).toEqual([
      { type: "bilateralFilter", diameter: 5, sigmaColor: 50, sigmaSpace: 60 },
    ]);
  });

  it("copyMakeBorder defaults borderType and color", async () => {
    await copyMakeBorder("/in.png", "/out.png", 1, 2, 3, 4);
    expect(opsOf()).toEqual([
      {
        type: "copyMakeBorder",
        top: 1,
        bottom: 2,
        left: 3,
        right: 4,
        borderType: "constant",
        color: [0, 0, 0],
      },
    ]);
  });

  it("copyMakeBorder forwards explicit borderType and color", async () => {
    await copyMakeBorder("/in.png", "/out.png", 1, 2, 3, 4, {
      borderType: "reflect101",
      color: [10, 20, 30],
    });
    expect(opsOf()).toEqual([
      {
        type: "copyMakeBorder",
        top: 1,
        bottom: 2,
        left: 3,
        right: 4,
        borderType: "reflect101",
        color: [10, 20, 30],
      },
    ]);
  });

  it("normalize defaults alpha, beta, and normType", async () => {
    await normalize("/in.png", "/out.png");
    expect(opsOf()).toEqual([
      { type: "normalize", alpha: 0, beta: 255, normType: "minmax" },
    ]);
  });

  it("normalize forwards explicit alpha, beta, and normType", async () => {
    await normalize("/in.png", "/out.png", 10, 200, "l2");
    expect(opsOf()).toEqual([
      { type: "normalize", alpha: 10, beta: 200, normType: "l2" },
    ]);
  });

  it("convertScaleAbs defaults alpha and beta", async () => {
    await convertScaleAbs("/in.png", "/out.png");
    expect(opsOf()).toEqual([{ type: "convertScaleAbs", alpha: 1, beta: 0 }]);
  });

  it("convertScaleAbs forwards explicit alpha and beta", async () => {
    await convertScaleAbs("/in.png", "/out.png", 2, 7);
    expect(opsOf()).toEqual([{ type: "convertScaleAbs", alpha: 2, beta: 7 }]);
  });

  it("lut evaluates a mapping function over 0..255", async () => {
    await lut("/in.png", "/out.png", (x) => 255 - x);
    expect(opsOf()).toEqual([
      {
        type: "lut",
        table: Array.from({ length: 256 }, (_unused, x) => 255 - x),
      },
    ]);
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
