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
});
