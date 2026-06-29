import { optimizePipeline } from "../core/optimize";
import type { SerializedOp } from "../core/pipeline";
import { pipeline } from "../index";
import { ioCall } from "./helpers";

jest.mock("../NativeReactNativeOpencvWrapper");

beforeEach(() => {
  jest.clearAllMocks();
});

const ramp = Array.from({ length: 256 }, (_unused, x) => x);
const invert = ramp.map((x) => 255 - x);
const lut = (table: number[]): SerializedOp => ({ type: "lut", table });

describe("optimizePipeline — point-op fusion", () => {
  it("leaves a lone lut untouched", () => {
    expect(optimizePipeline([lut(invert)])).toEqual([lut(invert)]);
  });

  it("leaves a lone bitwiseNot untouched", () => {
    expect(optimizePipeline([{ type: "bitwiseNot" }])).toEqual([
      { type: "bitwiseNot" },
    ]);
  });

  it("drops two inversions because they compose to the identity", () => {
    expect(optimizePipeline([lut(invert), lut(invert)])).toEqual([]);
    expect(
      optimizePipeline([{ type: "bitwiseNot" }, { type: "bitwiseNot" }]),
    ).toEqual([]);
  });

  it("fuses lut + bitwiseNot into one lut (255 - table[x])", () => {
    expect(optimizePipeline([lut(ramp), { type: "bitwiseNot" }])).toEqual([
      lut(invert),
    ]);
  });

  it("fuses bitwiseNot + lut into one lut (table[255 - x])", () => {
    expect(optimizePipeline([{ type: "bitwiseNot" }, lut(ramp)])).toEqual([
      lut(invert),
    ]);
  });

  it("fuses a run of luts by composing their tables", () => {
    const zeros = ramp.map(() => 0);
    const plus5 = ramp.map((x) => Math.min(255, x + 5));
    const [fused, ...rest] = optimizePipeline([lut(zeros), lut(plus5)]);
    expect(rest).toEqual([]);
    expect(fused!.type).toBe("lut");
    // every input -> zeros -> plus5[0] === 5
    expect(fused!.table).toEqual(ramp.map(() => 5));
  });

  it("only fuses adjacent point ops, not ones split by another op", () => {
    const ops: SerializedOp[] = [
      lut(invert),
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      lut(invert),
    ];
    expect(optimizePipeline(ops)).toEqual(ops);
  });

  it("drops an identity-composing run embedded between other ops", () => {
    const ops: SerializedOp[] = [
      { type: "gray" },
      lut(invert),
      { type: "bitwiseNot" },
      { type: "gaussianBlur", kernelSize: 3, sigmaX: 0 },
    ];
    expect(optimizePipeline(ops)).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 3, sigmaX: 0 },
    ]);
  });
});

describe("optimizePipeline — grayscale de-duplication", () => {
  it("collapses consecutive gray ops to one", () => {
    expect(
      optimizePipeline([{ type: "gray" }, { type: "gray" }, { type: "gray" }]),
    ).toEqual([{ type: "gray" }]);
  });

  it("keeps a gray followed by a different op and preserves order/params", () => {
    expect(
      optimizePipeline([
        { type: "gray" },
        { type: "gray" },
        { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
      ]),
    ).toEqual([
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 5, sigmaX: 0 },
    ]);
  });

  it("does not merge grays that are not adjacent", () => {
    const ops: SerializedOp[] = [
      { type: "gray" },
      { type: "gaussianBlur", kernelSize: 3, sigmaX: 0 },
      { type: "gray" },
    ];
    expect(optimizePipeline(ops)).toEqual(ops);
  });
});

describe("optimizePipeline — integration through pipeline.run()", () => {
  it("sends a single fused lut for chained point ops", async () => {
    await pipeline()
      .input("/in.png")
      .output("/out.png")
      .lut(() => 0)
      .lut((x) => x + 5)
      .run();

    const { ops } = ioCall();
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("lut");
    expect(ops[0].table).toEqual(ramp.map(() => 5));
  });

  it("collapses redundant gray ops before native", async () => {
    await pipeline().input("/in.png").output("/out.png").gray().gray().run();
    expect(ioCall().ops).toEqual([{ type: "gray" }]);
  });
});
