export default {
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
  runPipelineData: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
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
      }),
    ),
  ),
};
