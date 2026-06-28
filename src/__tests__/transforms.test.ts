import { pipeline } from "../index";
import { ioCall } from "./helpers";

jest.mock("../NativeReactNativeOpencvWrapper");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Transform op serialization", () => {
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
      .cvtColor("BGR2HSV")
      .inRange([35, 60, 60], [85, 255, 255])
      .filter2D([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ])
      .adaptiveThreshold(255, 11, 2)
      .morphologyEx("open", 3)
      .bitwiseNot()
      .drawRect(10, 20, 100, 50)
      .drawCircle(30, 40, 15)
      .drawLine(0, 0, 50, 50)
      .putText("hi", 5, 25)
      .drawPolygon([
        [0, 0],
        [10, 0],
        [10, 10],
      ])
      .warpPerspective(
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
      )
      .warpAffine(
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
      )
      .blend("/overlay.png")
      .equalizeHist()
      .clahe()
      .bilateralFilter()
      .copyMakeBorder(1, 2, 3, 4)
      .normalize()
      .convertScaleAbs()
      .lut((x) => 255 - x)
      .sobel(1, 0)
      .scharr(0, 1)
      .laplacian()
      .sepFilter2D([1, 0, -1], [1, 2, 1])
      .applyMask((m) =>
        m.cvtColor("BGR2HSV").inRange([35, 60, 60], [85, 255, 255]),
      )
      .debug("/tmp/dbg.png")
      .scanDocument()
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
      { type: "cvtColor", code: "BGR2HSV" },
      { type: "inRange", lower: [35, 60, 60], upper: [85, 255, 255] },
      {
        type: "filter2D",
        kernel: [
          [0, -1, 0],
          [-1, 5, -1],
          [0, -1, 0],
        ],
      },
      {
        type: "adaptiveThreshold",
        maxValue: 255,
        blockSize: 11,
        c: 2,
        method: "gaussian",
        thresholdType: "binary",
      },
      { type: "morphologyEx", operation: "open", kernelSize: 3, iterations: 1 },
      { type: "bitwiseNot" },
      {
        type: "drawRect",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
      {
        type: "drawCircle",
        centerX: 30,
        centerY: 40,
        radius: 15,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
      {
        type: "drawLine",
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 50,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
      {
        type: "putText",
        text: "hi",
        x: 5,
        y: 25,
        fontScale: 1,
        color: [255, 0, 0],
        thickness: 2,
        antialias: true,
      },
      {
        type: "drawPolygon",
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
        color: [255, 0, 0],
        thickness: 2,
        closed: true,
        antialias: true,
      },
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
      {
        type: "blend",
        source: "/overlay.png",
        alpha: 0.5,
        beta: 0.5,
        gamma: 0,
      },
      { type: "equalizeHist" },
      { type: "clahe", clipLimit: 2, tileGridSize: 8 },
      { type: "bilateralFilter", diameter: 9, sigmaColor: 75, sigmaSpace: 75 },
      {
        type: "copyMakeBorder",
        top: 1,
        bottom: 2,
        left: 3,
        right: 4,
        borderType: "constant",
        color: [0, 0, 0],
      },
      { type: "normalize", alpha: 0, beta: 255, normType: "minmax" },
      { type: "convertScaleAbs", alpha: 1, beta: 0 },
      {
        type: "lut",
        table: Array.from({ length: 256 }, (_unused, x) => 255 - x),
      },
      { type: "sobel", dx: 1, dy: 0, ksize: 3, scale: 1, delta: 0 },
      { type: "scharr", dx: 0, dy: 1, scale: 1, delta: 0 },
      { type: "laplacian", ksize: 1, scale: 1, delta: 0 },
      {
        type: "sepFilter2D",
        kernelX: [1, 0, -1],
        kernelY: [1, 2, 1],
        delta: 0,
      },
      {
        type: "applyMask",
        mask: [
          { type: "cvtColor", code: "BGR2HSV" },
          { type: "inRange", lower: [35, 60, 60], upper: [85, 255, 255] },
        ],
      },
      { type: "debug", path: "/tmp/dbg.png" },
      { type: "scanDocument" },
    ]);
  });

  it("passes explicit mask & morphology parameters through", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .adaptiveThreshold(200, 9, -3, "mean", "binaryInv")
      .morphologyEx("close", 5, 2)
      .applyMask((m) => m.gray())
      .run();

    expect(ioCall().ops).toEqual([
      {
        type: "adaptiveThreshold",
        maxValue: 200,
        blockSize: 9,
        c: -3,
        method: "mean",
        thresholdType: "binaryInv",
      },
      {
        type: "morphologyEx",
        operation: "close",
        kernelSize: 5,
        iterations: 2,
      },
      { type: "applyMask", mask: [{ type: "gray" }] },
    ]);
  });

  it("passes explicit annotation parameters through", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .drawRect(1, 2, 3, 4, {
        color: [10, 20, 30],
        thickness: 5,
        fillColor: [100, 110, 120],
        antialias: false,
      })
      .drawCircle(6, 7, 8, {
        color: [11, 22, 33],
        thickness: 9,
        fillColor: [44, 55, 66],
        antialias: false,
      })
      .drawLine(1, 2, 3, 4, {
        color: [40, 50, 60],
        thickness: 7,
        antialias: false,
      })
      .putText("label", 5, 6, {
        fontScale: 2,
        color: [70, 80, 90],
        thickness: 4,
        antialias: false,
      })
      .drawPolygon(
        [
          [1, 1],
          [2, 2],
          [3, 3],
        ],
        {
          color: [99, 88, 77],
          thickness: 6,
          closed: false,
          fillColor: [12, 13, 14],
          antialias: false,
        },
      )
      .run();

    expect(ioCall().ops).toEqual([
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
      {
        type: "drawCircle",
        centerX: 6,
        centerY: 7,
        radius: 8,
        color: [11, 22, 33],
        thickness: 9,
        fillColor: [44, 55, 66],
        antialias: false,
      },
      {
        type: "drawLine",
        x1: 1,
        y1: 2,
        x2: 3,
        y2: 4,
        color: [40, 50, 60],
        thickness: 7,
        antialias: false,
      },
      {
        type: "putText",
        text: "label",
        x: 5,
        y: 6,
        fontScale: 2,
        color: [70, 80, 90],
        thickness: 4,
        antialias: false,
      },
      {
        type: "drawPolygon",
        points: [
          [1, 1],
          [2, 2],
          [3, 3],
        ],
        color: [99, 88, 77],
        thickness: 6,
        closed: false,
        fillColor: [12, 13, 14],
        antialias: false,
      },
    ]);
  });

  it("passes explicit primitive-op parameters through", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .blend("/overlay.png", 0.7, 0.3, 5)
      .clahe(3, 16)
      .bilateralFilter(5, 50, 60)
      .copyMakeBorder(1, 2, 3, 4, {
        borderType: "reflect101",
        color: [10, 20, 30],
      })
      .normalize(10, 200, "l2")
      .convertScaleAbs(2, 7)
      .run();

    expect(ioCall().ops).toEqual([
      {
        type: "blend",
        source: "/overlay.png",
        alpha: 0.7,
        beta: 0.3,
        gamma: 5,
      },
      { type: "clahe", clipLimit: 3, tileGridSize: 16 },
      { type: "bilateralFilter", diameter: 5, sigmaColor: 50, sigmaSpace: 60 },
      {
        type: "copyMakeBorder",
        top: 1,
        bottom: 2,
        left: 3,
        right: 4,
        borderType: "reflect101",
        color: [10, 20, 30],
      },
      { type: "normalize", alpha: 10, beta: 200, normType: "l2" },
      { type: "convertScaleAbs", alpha: 2, beta: 7 },
    ]);
  });

  it("lut accepts a precomputed 256-entry table and clamps out-of-range values", async () => {
    const table = Array.from({ length: 256 }, (_unused, x) => x - 5);
    await pipeline().input("/in.png").output("/out.png").lut(table).run();

    const expected = table.map((value) => Math.max(0, Math.min(255, value)));
    expect(ioCall().ops).toEqual([{ type: "lut", table: expected }]);
  });

  it("lut rounds fractional outputs and rejects tables that are not 256 long", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .lut((x) => x / 2 + 0.5)
      .run();

    const expected = Array.from({ length: 256 }, (_unused, x) =>
      Math.round(x / 2 + 0.5),
    );
    expect(ioCall().ops).toEqual([{ type: "lut", table: expected }]);

    expect(() =>
      pipeline().input("/in.png").output("/out.png").lut([0, 1, 2]),
    ).toThrow("lut table must have exactly 256 entries");
  });

  it("passes explicit gradient-op parameters through", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .sobel(2, 0, 5, 2, 10)
      .scharr(1, 0, 3, 4)
      .laplacian(3, 2, 5)
      .sepFilter2D([1, 2, 1], [1, 0, -1], 7)
      .run();

    expect(ioCall().ops).toEqual([
      { type: "sobel", dx: 2, dy: 0, ksize: 5, scale: 2, delta: 10 },
      { type: "scharr", dx: 1, dy: 0, scale: 3, delta: 4 },
      { type: "laplacian", ksize: 3, scale: 2, delta: 5 },
      {
        type: "sepFilter2D",
        kernelX: [1, 2, 1],
        kernelY: [1, 0, -1],
        delta: 7,
      },
    ]);
  });
});
