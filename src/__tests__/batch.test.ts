import { runBatch, presets, pipeline } from "../index";
import type { BatchItem } from "../index";
import { native, ioCall } from "./helpers";

jest.mock("../NativeReactNativeOpencvWrapper");

// Restore a known runPipelineIO implementation before each test. clearAllMocks
// wipes recorded calls but not implementations, so any per-test override (e.g.
// the concurrency probes below) would otherwise leak into later tests.
const defaultRunPipelineIO = (_inputJson: string, outputJson: string) => {
  const sink = JSON.parse(outputJson) as
    | { kind: "path"; value: string }
    | { kind: "base64"; ext: string };
  return Promise.resolve(
    sink.kind === "path" ? sink.value : `base64:${sink.ext}`,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  native.runPipelineIO.mockImplementation(defaultRunPipelineIO);
});

describe("runBatch", () => {
  it("runs a recipe across multiple items, preserving order", async () => {
    const recipe = pipeline().gray().toJSON();
    const items: BatchItem[] = [
      { input: "/a.jpg", output: "/a.png" },
      { input: "/b.jpg", output: "/b.png" },
    ];

    const results = await runBatch(recipe, items, { concurrency: 1 });

    expect(results).toEqual([
      { index: 0, status: "fulfilled", output: "/a.png" },
      { index: 1, status: "fulfilled", output: "/b.png" },
    ]);
    expect(ioCall(0)).toEqual({
      input: { kind: "path", value: "/a.jpg" },
      output: { kind: "path", value: "/a.png" },
      ops: [{ type: "gray" }],
    });
    expect(ioCall(1).input).toEqual({ kind: "path", value: "/b.jpg" });
  });

  it("supports base64 sources and sinks", async () => {
    const results = await runBatch(presets.edges, [
      { input: { base64: "AAAA" }, output: { base64: "jpg" } },
    ]);

    expect(results[0]).toEqual({
      index: 0,
      status: "fulfilled",
      output: "base64:.jpg",
    });
    expect(ioCall(0).input).toEqual({ kind: "base64", value: "AAAA" });
    expect(ioCall(0).output).toEqual({ kind: "base64", ext: ".jpg" });
  });

  it("accepts a raw ops array as the recipe", async () => {
    await runBatch([{ type: "gray" }], [{ input: "/a.jpg", output: "/a.png" }]);

    expect(ioCall(0).ops).toEqual([{ type: "gray" }]);
  });

  it("reports per-item failures without rejecting the batch", async () => {
    native.runPipelineIO.mockRejectedValueOnce(new Error("boom"));

    const results = await runBatch(
      pipeline().gray().toJSON(),
      [
        { input: "/a.jpg", output: "/a.png" },
        { input: "/b.jpg", output: "/b.png" },
      ],
      { concurrency: 1 },
    );

    expect(results[0]).toMatchObject({ index: 0, status: "rejected" });
    expect((results[0] as { error: Error }).error.message).toBe("boom");
    expect(results[1]).toEqual({
      index: 1,
      status: "fulfilled",
      output: "/b.png",
    });
  });

  it("processes all items at once by default", async () => {
    let active = 0;
    let peak = 0;
    native.runPipelineIO.mockImplementation(async (_i, outputJson) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return (JSON.parse(outputJson) as { value: string }).value;
    });

    const items: BatchItem[] = Array.from({ length: 5 }, (_, i) => ({
      input: `/in${i}.jpg`,
      output: `/out${i}.png`,
    }));

    await runBatch(pipeline().gray().toJSON(), items);

    expect(peak).toBe(5);
  });

  it("never exceeds the requested concurrency", async () => {
    let active = 0;
    let peak = 0;
    native.runPipelineIO.mockImplementation(async (_i, outputJson) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return (JSON.parse(outputJson) as { value: string }).value;
    });

    const items: BatchItem[] = Array.from({ length: 6 }, (_, i) => ({
      input: `/in${i}.jpg`,
      output: `/out${i}.png`,
    }));

    await runBatch(pipeline().gray().toJSON(), items, { concurrency: 2 });

    expect(peak).toBe(2);
  });

  it("treats a concurrency below 1 as 1", async () => {
    const results = await runBatch(
      pipeline().gray().toJSON(),
      [{ input: "/a.jpg", output: "/a.png" }],
      { concurrency: 0 },
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ status: "fulfilled" });
    expect(native.runPipelineIO).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array and runs nothing for no items", async () => {
    const results = await runBatch(pipeline().gray().toJSON(), []);

    expect(results).toEqual([]);
    expect(native.runPipelineIO).not.toHaveBeenCalled();
  });
});
