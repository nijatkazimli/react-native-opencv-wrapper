import { pipeline } from "../index";
import { native, dataCall } from "./helpers";

jest.mock("../NativeReactNativeOpencvWrapper");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Data-returning analysis ops", () => {
  it("decodeQR resolves with the parsed structured result", async () => {
    const result = await pipeline().input("/abs/qr.png").decodeQR();

    expect(result).toEqual({
      found: true,
      codes: [
        {
          value: "hello",
          corners: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 5, y: 6 },
            { x: 7, y: 8 },
          ],
        },
      ],
    });
    expect(native.runPipelineData).toHaveBeenCalledTimes(1);
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });

  it("appends decodeQR as the trailing op with no transforms queued", async () => {
    await pipeline().input("/abs/qr.png").decodeQR();

    const { input, ops } = dataCall();
    expect(input).toEqual({ kind: "path", value: "/abs/qr.png" });
    expect(ops).toEqual([{ type: "decodeQR" }]);
  });

  it("runs queued transform steps before the trailing decodeQR op", async () => {
    await pipeline()
      .inputBase64("data:image/png;base64,QUJD")
      .gray()
      .gaussianBlur(5)
      .decodeQR();

    const { input, ops } = dataCall();
    expect(input).toEqual({
      kind: "base64",
      value: "data:image/png;base64,QUJD",
    });
    expect(ops).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      { type: "decodeQR" },
    ]);
  });

  it("does not mutate the pipeline's queued ops when analyzing", async () => {
    const base = pipeline().input("/abs/qr.png").gray();

    await base.decodeQR();
    await base.decodeQR();

    expect(dataCall(0).ops).toEqual([{ type: "gray" }, { type: "decodeQR" }]);
    expect(dataCall(1).ops).toEqual([{ type: "gray" }, { type: "decodeQR" }]);
  });

  it("detectDocument resolves with the parsed corner result", async () => {
    native.runPipelineData.mockResolvedValueOnce(
      JSON.stringify({
        found: true,
        corners: [
          { x: 10, y: 20 },
          { x: 110, y: 25 },
          { x: 105, y: 200 },
          { x: 8, y: 195 },
        ],
        width: 320,
        height: 240,
      }),
    );

    const result = await pipeline().input("/abs/doc.png").detectDocument();

    expect(result).toEqual({
      found: true,
      corners: [
        { x: 10, y: 20 },
        { x: 110, y: 25 },
        { x: 105, y: 200 },
        { x: 8, y: 195 },
      ],
      width: 320,
      height: 240,
    });
    expect(native.runPipelineData).toHaveBeenCalledTimes(1);
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });

  it("appends detectDocument as the trailing op after transforms", async () => {
    await pipeline().input("/abs/doc.png").gray().detectDocument();

    const { input, ops } = dataCall();
    expect(input).toEqual({ kind: "path", value: "/abs/doc.png" });
    expect(ops).toEqual([{ type: "gray" }, { type: "detectDocument" }]);
  });

  it("findContours resolves with the parsed shape result", async () => {
    native.runPipelineData.mockResolvedValueOnce(
      JSON.stringify({
        found: true,
        count: 1,
        contours: [
          {
            area: 1000,
            points: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 10 },
              { x: 0, y: 10 },
            ],
            boundingBox: { x: 0, y: 0, width: 10, height: 10 },
            minAreaRect: {
              centerX: 5,
              centerY: 5,
              width: 10,
              height: 10,
              angle: 0,
            },
          },
        ],
        width: 320,
        height: 240,
      }),
    );

    const result = await pipeline()
      .input("/abs/shapes.png")
      .gray()
      .threshold(128, 255)
      .findContours();

    expect(result.found).toBe(true);
    expect(result.count).toBe(1);
    expect(result.contours[0]!.area).toBe(1000);
    expect(native.runPipelineData).toHaveBeenCalledTimes(1);
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });

  it("appends findContours with defaulted options after transforms", async () => {
    await pipeline().input("/abs/shapes.png").gray().findContours();

    const { input, ops } = dataCall();
    expect(input).toEqual({ kind: "path", value: "/abs/shapes.png" });
    expect(ops).toEqual([
      { type: "gray" },
      { type: "findContours", mode: "external", minArea: 0, epsilon: 0 },
    ]);
  });

  it("forwards explicit findContours options", async () => {
    await pipeline()
      .input("/abs/shapes.png")
      .findContours({ mode: "list", minArea: 50, epsilon: 0.02 });

    expect(dataCall().ops).toEqual([
      { type: "findContours", mode: "list", minArea: 50, epsilon: 0.02 },
    ]);
  });

  it("connectedComponents resolves with the parsed result and forwards options", async () => {
    native.runPipelineData.mockResolvedValueOnce(
      JSON.stringify({
        found: true,
        count: 1,
        components: [
          {
            label: 1,
            area: 400,
            boundingBox: { x: 0, y: 0, width: 20, height: 20 },
            centroid: { x: 10, y: 10 },
          },
        ],
        width: 100,
        height: 100,
      }),
    );

    const result = await pipeline()
      .input("/abs/blobs.png")
      .gray()
      .connectedComponents({ connectivity: 4, minArea: 10 });

    expect(result.count).toBe(1);
    expect(dataCall().ops).toEqual([
      { type: "gray" },
      { type: "connectedComponents", connectivity: 4, minArea: 10 },
    ]);
  });

  it("connectedComponents applies defaults", async () => {
    await pipeline().input("/abs/blobs.png").connectedComponents();

    expect(dataCall().ops).toEqual([
      { type: "connectedComponents", connectivity: 8, minArea: 0 },
    ]);
  });

  it("houghLines defaults and explicit options round-trip", async () => {
    await pipeline().input("/abs/edges.png").houghLines();
    await pipeline()
      .input("/abs/edges.png")
      .houghLines({ threshold: 50, minLineLength: 20, maxLineGap: 5 });

    expect(dataCall(0).ops).toEqual([
      {
        type: "houghLines",
        rho: 1,
        theta: Math.PI / 180,
        threshold: 80,
        minLineLength: 30,
        maxLineGap: 10,
      },
    ]);
    expect(dataCall(1).ops).toEqual([
      {
        type: "houghLines",
        rho: 1,
        theta: Math.PI / 180,
        threshold: 50,
        minLineLength: 20,
        maxLineGap: 5,
      },
    ]);
  });

  it("houghCircles defaults and explicit options round-trip", async () => {
    await pipeline().input("/abs/coins.png").houghCircles();
    await pipeline()
      .input("/abs/coins.png")
      .houghCircles({ minDist: 50, param2: 40, minRadius: 5, maxRadius: 80 });

    expect(dataCall(0).ops).toEqual([
      {
        type: "houghCircles",
        dp: 1,
        minDist: 20,
        param1: 100,
        param2: 30,
        minRadius: 0,
        maxRadius: 0,
      },
    ]);
    expect(dataCall(1).ops).toEqual([
      {
        type: "houghCircles",
        dp: 1,
        minDist: 50,
        param1: 100,
        param2: 40,
        minRadius: 5,
        maxRadius: 80,
      },
    ]);
  });

  it("boundingRect/minAreaRect default to the largest contour and accept points", async () => {
    await pipeline().input("/abs/shape.png").boundingRect();
    await pipeline().input("/abs/shape.png").minAreaRect();
    await pipeline()
      .input("/abs/shape.png")
      .boundingRect({
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
      });
    await pipeline()
      .input("/abs/shape.png")
      .minAreaRect({
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
      });

    expect(dataCall(0).ops).toEqual([{ type: "boundingRect" }]);
    expect(dataCall(1).ops).toEqual([{ type: "minAreaRect" }]);
    expect(dataCall(2).ops).toEqual([
      {
        type: "boundingRect",
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
      },
    ]);
    expect(dataCall(3).ops).toEqual([
      {
        type: "minAreaRect",
        points: [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
      },
    ]);
  });

  it("approxPolyDP forwards epsilon, closed and optional points", async () => {
    await pipeline().input("/abs/shape.png").approxPolyDP();
    await pipeline()
      .input("/abs/shape.png")
      .approxPolyDP({
        epsilon: 0.05,
        closed: false,
        points: [
          [1, 1],
          [9, 9],
        ],
      });

    expect(dataCall(0).ops).toEqual([
      { type: "approxPolyDP", epsilon: 0.02, closed: true },
    ]);
    expect(dataCall(1).ops).toEqual([
      {
        type: "approxPolyDP",
        epsilon: 0.05,
        closed: false,
        points: [
          [1, 1],
          [9, 9],
        ],
      },
    ]);
  });

  it("contour-metric ops default to the largest contour", async () => {
    await pipeline().input("/abs/shape.png").contourArea();
    await pipeline().input("/abs/shape.png").arcLength();
    await pipeline().input("/abs/shape.png").convexHull();
    await pipeline().input("/abs/shape.png").fitEllipse();
    await pipeline().input("/abs/shape.png").fitLine();

    expect(dataCall(0).ops).toEqual([{ type: "contourArea" }]);
    expect(dataCall(1).ops).toEqual([{ type: "arcLength", closed: true }]);
    expect(dataCall(2).ops).toEqual([{ type: "convexHull" }]);
    expect(dataCall(3).ops).toEqual([{ type: "fitEllipse" }]);
    expect(dataCall(4).ops).toEqual([{ type: "fitLine" }]);
  });

  it("contour-metric ops forward explicit points and arcLength.closed", async () => {
    const points = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5],
    ] as const;

    await pipeline().input("/abs/shape.png").contourArea({ points });
    await pipeline()
      .input("/abs/shape.png")
      .arcLength({ closed: false, points });
    await pipeline().input("/abs/shape.png").convexHull({ points });
    await pipeline().input("/abs/shape.png").fitEllipse({ points });
    await pipeline().input("/abs/shape.png").fitLine({ points });

    const expanded = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5],
    ];
    expect(dataCall(0).ops).toEqual([
      { type: "contourArea", points: expanded },
    ]);
    expect(dataCall(1).ops).toEqual([
      { type: "arcLength", closed: false, points: expanded },
    ]);
    expect(dataCall(2).ops).toEqual([{ type: "convexHull", points: expanded }]);
    expect(dataCall(3).ops).toEqual([{ type: "fitEllipse", points: expanded }]);
    expect(dataCall(4).ops).toEqual([{ type: "fitLine", points: expanded }]);
  });

  it("image-statistics ops serialize with no params", async () => {
    await pipeline().input("/abs/img.png").meanStdDev();
    await pipeline().input("/abs/img.png").minMaxLoc();
    await pipeline().input("/abs/img.png").countNonZero();

    expect(dataCall(0).ops).toEqual([{ type: "meanStdDev" }]);
    expect(dataCall(1).ops).toEqual([{ type: "minMaxLoc" }]);
    expect(dataCall(2).ops).toEqual([{ type: "countNonZero" }]);
  });

  it("calcHist applies defaults and forwards options", async () => {
    await pipeline().input("/abs/img.png").calcHist();
    await pipeline().input("/abs/img.png").calcHist({ bins: 64, channel: 1 });

    expect(dataCall(0).ops).toEqual([
      { type: "calcHist", bins: 256, channel: 0 },
    ]);
    expect(dataCall(1).ops).toEqual([
      { type: "calcHist", bins: 64, channel: 1 },
    ]);
  });

  it("matchTemplate forwards the template source and defaulted method", async () => {
    await pipeline()
      .input("/abs/scene.png")
      .matchTemplate({ template: "/abs/logo.png" });
    await pipeline()
      .input("/abs/scene.png")
      .matchTemplate({ template: "/abs/logo.png", method: "sqdiff" });

    expect(dataCall(0).ops).toEqual([
      {
        type: "matchTemplate",
        template: "/abs/logo.png",
        method: "ccoeffNormed",
      },
    ]);
    expect(dataCall(1).ops).toEqual([
      { type: "matchTemplate", template: "/abs/logo.png", method: "sqdiff" },
    ]);
  });

  it("resolves the parsed structured result of a metric op", async () => {
    native.runPipelineData.mockResolvedValueOnce(
      JSON.stringify({ found: true, area: 1234, width: 100, height: 80 }),
    );

    const result = await pipeline().input("/abs/shape.png").contourArea();

    expect(result).toEqual({ found: true, area: 1234, width: 100, height: 80 });
    expect(native.runPipelineData).toHaveBeenCalledTimes(1);
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });
});
