import { pipeline, Pipeline, presets } from "../index";
import type { PipelineRecipe, ReadyPipeline } from "../index";
import { native, ioCall } from "./helpers";

jest.mock("../NativeReactNativeOpencvWrapper");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Pipeline serialization", () => {
  it("toJSON() captures ops without input/output for a bare pipeline", () => {
    const recipe = pipeline().gray().gaussianBlur(5).toJSON();
    expect(recipe).toEqual({
      version: 1,
      ops: [
        { type: "gray" },
        { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      ],
    });
    expect(recipe.input).toBeUndefined();
    expect(recipe.output).toBeUndefined();
  });

  it("toJSON() includes captured input and output when set", () => {
    const recipe = pipeline()
      .input("/in.png")
      .outputBase64("jpg")
      .canny(50, 150)
      .toJSON();

    expect(recipe.input).toEqual({ kind: "path", value: "/in.png" });
    expect(recipe.output).toEqual({ kind: "base64", ext: ".jpg" });
    expect(recipe.ops).toEqual([
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
  });

  it("JSON.stringify(pipeline) uses toJSON()", () => {
    const json = JSON.stringify(pipeline().gray());
    expect(JSON.parse(json)).toEqual({ version: 1, ops: [{ type: "gray" }] });
  });

  it("toJSON() returns an independent copy of the ops", () => {
    const base = pipeline().gray();
    const recipe = base.toJSON();
    recipe.ops.push({ type: "tampered" });
    expect(base.toJSON().ops).toEqual([{ type: "gray" }]);
  });

  it("fromJSON() restores ops and runs them", async () => {
    const recipe = pipeline().gray().canny(50, 150).toJSON();

    await Pipeline.fromJSON(recipe).input("/in.png").output("/out.png").run();

    const { ops, input, output } = ioCall();
    expect(ops).toEqual([
      { type: "gray" },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
    expect(input).toEqual({ kind: "path", value: "/in.png" });
    expect(output).toEqual({ kind: "path", value: "/out.png" });
  });

  it("fromJSON() restores captured input and output", async () => {
    const recipe = pipeline()
      .input("/in.png")
      .output("/out.png")
      .gray()
      .toJSON();

    // fromJSON returns a state-untyped pipeline; the input/output are restored
    // at runtime, so a cast is enough to call run().
    await (Pipeline.fromJSON(recipe) as unknown as ReadyPipeline).run();

    expect(ioCall().input).toEqual({ kind: "path", value: "/in.png" });
    expect(ioCall().output).toEqual({ kind: "path", value: "/out.png" });
  });

  it("fromJSON() accepts a JSON string", async () => {
    const json = JSON.stringify(pipeline().gray());

    await Pipeline.fromJSON(json).input("/in.png").output("/out.png").run();

    expect(ioCall().ops).toEqual([{ type: "gray" }]);
  });

  it("fromJSON() copies ops so the source recipe is not shared", async () => {
    const recipe = pipeline().gray().toJSON();
    const restored = Pipeline.fromJSON(recipe);
    recipe.ops[0]!.type = "tampered";

    await restored.input("/in.png").output("/out.png").run();

    expect(ioCall().ops).toEqual([{ type: "gray" }]);
  });

  it("fromJSON() throws on a malformed recipe", () => {
    expect(() => Pipeline.fromJSON(null as unknown as PipelineRecipe)).toThrow(
      "invalid recipe",
    );
    expect(() => Pipeline.fromJSON("5")).toThrow("expected an object");
    expect(() =>
      Pipeline.fromJSON({ version: 1 } as unknown as PipelineRecipe),
    ).toThrow("invalid recipe");
  });

  it("fromJSON() rejects an unsupported recipe version", () => {
    expect(() =>
      Pipeline.fromJSON({ version: 2, ops: [] } as unknown as PipelineRecipe),
    ).toThrow("unsupported recipe version 2");
    expect(() =>
      Pipeline.fromJSON({ ops: [] } as unknown as PipelineRecipe),
    ).toThrow("unsupported recipe version undefined");
  });

  it("fromJSON() rejects a malformed op entry", () => {
    expect(() =>
      Pipeline.fromJSON({
        version: 1,
        ops: [null],
      } as unknown as PipelineRecipe),
    ).toThrow("invalid op at index 0");
  });

  it("fromJSON() rejects an unknown op type", () => {
    expect(() =>
      Pipeline.fromJSON({
        version: 1,
        ops: [{ type: "gray" }, { type: "nope" }],
      } as unknown as PipelineRecipe),
    ).toThrow("unknown op 'nope' at index 1");
  });
});

describe("Pipeline.apply", () => {
  it("appends a recipe's ops to the current chain", async () => {
    const recipe = pipeline().gaussianBlur(5).canny(50, 150).toJSON();

    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .gray()
      .apply(recipe)
      .run();

    expect(ioCall().ops).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      { type: "canny", threshold1: 50, threshold2: 150 },
    ]);
  });

  it("accepts a raw SerializedOp array", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .apply([{ type: "gray" }, { type: "bitwiseNot" }])
      .run();

    expect(ioCall().ops).toEqual([{ type: "gray" }, { type: "bitwiseNot" }]);
  });

  it("ignores a recipe's captured input/output", async () => {
    const recipe = pipeline()
      .input("/other.png")
      .outputBase64("png")
      .gray()
      .toJSON();

    await pipeline().input("/in.png").output("/out.png").apply(recipe).run();

    const { input, output } = ioCall();
    expect(input).toEqual({ kind: "path", value: "/in.png" });
    expect(output).toEqual({ kind: "path", value: "/out.png" });
  });

  it("copies ops so mutating the source array does not leak", async () => {
    const ops = [{ type: "gray" }];
    const p = pipeline().input("/in.png").output("/out.png").apply(ops);
    ops[0]!.type = "tampered";

    await p.run();

    expect(ioCall().ops).toEqual([{ type: "gray" }]);
  });
});

describe("presets", () => {
  it("edges is a denoise + Canny edge recipe", () => {
    expect(presets.edges).toEqual({
      version: 1,
      ops: [
        { type: "gray" },
        { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
        { type: "canny", threshold1: 50, threshold2: 150 },
      ],
    });
  });

  it("crispScan binarizes via adaptive threshold", () => {
    expect(presets.crispScan.ops).toEqual([
      { type: "gray" },
      {
        type: "adaptiveThreshold",
        maxValue: 255,
        blockSize: 15,
        c: 5,
        method: "gaussian",
        thresholdType: "binary",
      },
    ]);
  });

  it("softenPortrait smooths then boosts local contrast", () => {
    expect(presets.softenPortrait.ops).toEqual([
      { type: "bilateralFilter", diameter: 9, sigmaColor: 75, sigmaSpace: 75 },
      { type: "clahe", clipLimit: 2, tileGridSize: 8 },
    ]);
  });

  it("a preset can be applied to a live pipeline", async () => {
    await pipeline()
      .input("/in.png")
      .outputBase64("png")
      .apply(presets.edges)
      .run();

    expect(ioCall().ops).toEqual(presets.edges.ops);
    expect(native.runPipelineIO).toHaveBeenCalledTimes(1);
  });

  it("a preset can be loaded standalone via fromJSON", async () => {
    await Pipeline.fromJSON(presets.crispScan)
      .input("/in.png")
      .output("/out.png")
      .run();

    expect(ioCall().ops).toEqual(presets.crispScan.ops);
  });
});
