// OpenCVOpRegistryTests
// -----------------------------------------------------------------------------
// XCTest suite that drives OpenCVOpRegistry against the real OpenCV library.
// Each test writes a synthetic image to a temp file, runs a file-to-file
// pipeline, decodes the result, and asserts on it — mirroring the Android
// instrumented tests.

#import <XCTest/XCTest.h>

#ifdef __cplusplus
#import <opencv2/opencv.hpp>
#endif

#import "OpenCVOpRegistry.h"

static const int kWidth = 40;
static const int kHeight = 60;

@interface OpenCVOpRegistryTests : XCTestCase
@end

@implementation OpenCVOpRegistryTests

// Write a deterministic 3-channel BGR image and return its path.
- (NSString *)writeSourceImage:(NSString *)name {
  cv::Mat mat(kHeight, kWidth, CV_8UC3, cv::Scalar(10, 20, 30));
  NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:name];
  bool ok = cv::imwrite(path.UTF8String, mat);
  XCTAssertTrue(ok, @"failed to write source image");
  return path;
}

- (NSString *)outputPath:(NSString *)name {
  return [NSTemporaryDirectory() stringByAppendingPathComponent:name];
}

- (cv::Mat)readResult:(NSString *)path {
  cv::Mat mat = cv::imread(path.UTF8String, cv::IMREAD_UNCHANGED);
  XCTAssertFalse(mat.empty(), @"result image could not be read at %@", path);
  return mat;
}

// Encode the synthetic source image to a base64 string for the in-memory API.
- (NSString *)sourceBase64:(NSString *)ext {
  cv::Mat mat(kHeight, kWidth, CV_8UC3, cv::Scalar(10, 20, 30));
  std::vector<uchar> buf;
  bool ok = cv::imencode(ext.UTF8String, mat, buf);
  XCTAssertTrue(ok, @"failed to encode source image");
  NSData *data = [NSData dataWithBytes:buf.data() length:buf.size()];
  return [data base64EncodedStringWithOptions:0];
}

// Decode a base64 result string back into a Mat for assertions.
- (cv::Mat)decodeBase64Result:(NSString *)b64 {
  NSData *data = [[NSData alloc] initWithBase64EncodedString:b64
                                                     options:NSDataBase64DecodingIgnoreUnknownCharacters];
  XCTAssertNotNil(data, @"base64 result could not be decoded");
  std::vector<uchar> buf((const uchar *)data.bytes, (const uchar *)data.bytes + data.length);
  cv::Mat mat = cv::imdecode(buf, cv::IMREAD_UNCHANGED);
  XCTAssertFalse(mat.empty(), @"base64 result decoded to an empty image");
  return mat;
}

- (void)testGrayProducesSingleChannelImage {
  NSString *input = [self writeSourceImage:@"gray-in.png"];
  NSString *output = [self outputPath:@"gray-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"gray\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testResizeChangesDimensions {
  NSString *input = [self writeSourceImage:@"resize-in.png"];
  NSString *output = [self outputPath:@"resize-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"resize\",\"width\":20,\"height\":10,\"interpolation\":\"linear\"}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, 20);
  XCTAssertEqual(result.rows, 10);
}

- (void)testRotate90SwapsDimensions {
  NSString *input = [self writeSourceImage:@"rotate-in.png"];
  NSString *output = [self outputPath:@"rotate-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"rotate\",\"angle\":90}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kHeight);
  XCTAssertEqual(result.rows, kWidth);
}

- (void)testThresholdBinaryProducesExtremeValues {
  NSString *input = [self writeSourceImage:@"threshold-in.png"];
  NSString *output = [self outputPath:@"threshold-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"threshold\",\"thresh\":15,\"maxValue\":255,\"thresholdType\":\"binary\"}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  // Source pixel is (B=10, G=20, R=30); a binary threshold at 15 maps each
  // channel to either 0 or 255.
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 255);
  XCTAssertEqual(pixel[2], 255);
}

- (void)testMultiStepPipelineChainsOps {
  NSString *input = [self writeSourceImage:@"chain-in.png"];
  NSString *output = [self outputPath:@"chain-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"gray\"},{\"type\":\"resize\",\"width\":20,\"height\":10,\"interpolation\":\"nearest\"}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, 20);
  XCTAssertEqual(result.rows, 10);
}

- (void)testUnknownOpFailsWithStableCode {
  NSString *input = [self writeSourceImage:@"unknown-in.png"];
  NSString *output = [self outputPath:@"unknown-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"notAnOp\"}]"
                                             error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorUnknownOp);
}

- (void)testInvalidRotateAngleFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"invalid-in.png"];
  NSString *output = [self outputPath:@"invalid-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"rotate\",\"angle\":45}]"
                                             error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testGaussianBlurPreservesShape {
  NSString *input = [self writeSourceImage:@"blur-in.png"];
  NSString *output = [self outputPath:@"blur-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"gaussianBlur\",\"kernelSize\":5,\"sigmaX\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testCannyProducesSingleChannelEdges {
  NSString *input = [self writeSourceImage:@"canny-in.png"];
  NSString *output = [self outputPath:@"canny-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"canny\",\"threshold1\":50,\"threshold2\":150}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testCropExtractsRegion {
  NSString *input = [self writeSourceImage:@"crop-in.png"];
  NSString *output = [self outputPath:@"crop-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"crop\",\"x\":5,\"y\":10,\"width\":20,\"height\":15}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, 20);
  XCTAssertEqual(result.rows, 15);
}

- (void)testFlipPreservesShape {
  NSString *input = [self writeSourceImage:@"flip-in.png"];
  NSString *output = [self outputPath:@"flip-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"flip\",\"direction\":\"horizontal\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testMedianBlurPreservesShape {
  NSString *input = [self writeSourceImage:@"median-in.png"];
  NSString *output = [self outputPath:@"median-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"medianBlur\",\"kernelSize\":5}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testDilatePreservesShape {
  NSString *input = [self writeSourceImage:@"dilate-in.png"];
  NSString *output = [self outputPath:@"dilate-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"dilate\",\"kernelSize\":3,\"iterations\":1}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testErodePreservesShape {
  NSString *input = [self writeSourceImage:@"erode-in.png"];
  NSString *output = [self outputPath:@"erode-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"erode\",\"kernelSize\":3,\"iterations\":2}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

#pragma mark - In-memory / base64 I/O (runPipelineWithInputJson)

- (void)testBase64InputToPathOutput {
  NSString *output = [self outputPath:@"io-b64-in.png"];
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];
  NSString *outputJson =
      [NSString stringWithFormat:@"{\"kind\":\"path\",\"value\":\"%@\"}", output];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:outputJson
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(error, @"pipeline failed: %@", error);
  XCTAssertEqualObjects(result, output);

  cv::Mat mat = [self readResult:output];
  XCTAssertEqual(mat.channels(), 1);
  XCTAssertEqual(mat.cols, kWidth);
  XCTAssertEqual(mat.rows, kHeight);
}

- (void)testPathInputToBase64Output {
  NSString *input = [self writeSourceImage:@"io-b64-out.png"];
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"path\",\"value\":\"%@\"}", input];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:@"{\"kind\":\"base64\",\"ext\":\".png\"}"
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(error, @"pipeline failed: %@", error);
  XCTAssertGreaterThan(result.length, 0u);

  cv::Mat mat = [self decodeBase64Result:result];
  XCTAssertEqual(mat.channels(), 1);
  XCTAssertEqual(mat.cols, kWidth);
  XCTAssertEqual(mat.rows, kHeight);
}

- (void)testBase64InputToBase64Output {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry
      runPipelineWithInputJson:inputJson
                    outputJson:@"{\"kind\":\"base64\",\"ext\":\".png\"}"
                       opsJson:@"[{\"type\":\"resize\",\"width\":20,\"height\":10,\"interpolation\":\"linear\"}]"
                         error:&error];
  XCTAssertNil(error, @"pipeline failed: %@", error);

  cv::Mat mat = [self decodeBase64Result:result];
  XCTAssertEqual(mat.cols, 20);
  XCTAssertEqual(mat.rows, 10);
}

- (void)testBase64OutputDefaultsToPngWhenExtOmitted {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:@"{\"kind\":\"base64\"}"
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(error, @"pipeline failed: %@", error);

  cv::Mat mat = [self decodeBase64Result:result];
  XCTAssertEqual(mat.channels(), 1);
  XCTAssertEqual(mat.cols, kWidth);
  XCTAssertEqual(mat.rows, kHeight);
}

- (void)testBase64InputAcceptsDataURIPrefix {
  NSString *output = [self outputPath:@"io-datauri.png"];
  NSString *inputJson = [NSString
      stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"data:image/png;base64,%@\"}",
                       [self sourceBase64:@".png"]];
  NSString *outputJson =
      [NSString stringWithFormat:@"{\"kind\":\"path\",\"value\":\"%@\"}", output];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:outputJson
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(error, @"pipeline failed: %@", error);
  XCTAssertEqualObjects(result, output);

  cv::Mat mat = [self readResult:output];
  XCTAssertEqual(mat.channels(), 1);
}

- (void)testInvalidBase64InputFailsWithIOError {
  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:@"{\"kind\":\"base64\",\"value\":\"???\"}"
                                                     outputJson:@"{\"kind\":\"base64\",\"ext\":\".png\"}"
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorIO);
}

- (void)testUnknownInputKindFailsWithInvalidArgument {
  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:@"{\"kind\":\"bogus\"}"
                                                     outputJson:@"{\"kind\":\"base64\",\"ext\":\".png\"}"
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testUnknownOutputKindFailsWithInvalidArgument {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:@"{\"kind\":\"bogus\"}"
                                                        opsJson:@"[{\"type\":\"gray\"}]"
                                                          error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testUnknownOpThroughInputJsonFailsWithStableCode {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                     outputJson:@"{\"kind\":\"base64\",\"ext\":\".png\"}"
                                                        opsJson:@"[{\"type\":\"notAnOp\"}]"
                                                          error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorUnknownOp);
}

#pragma mark - Data-returning analysis ops (runPipelineDataWithInputJson)

// A pre-generated QR code carrying `kQRFixtureValue`, as a base64 PNG. We embed
// a fixture instead of encoding at runtime because `cv::QRCodeEncoder` was only
// added in OpenCV 4.4, while the wrapper (and its CocoaPods `OpenCV` dependency)
// targets 4.3+. Decoding (`detectAndDecodeMulti`) is available from 4.3.
static NSString *const kQRFixtureValue = @"https://opencv.org";

- (NSString *)qrFixtureBase64 {
  return @"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";
}

// Parse a JSON analysis result string into an NSDictionary.
- (NSDictionary *)parseDataResult:(NSString *)json {
  XCTAssertNotNil(json, @"analysis result was nil");
  NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
  NSError *error = nil;
  id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
  XCTAssertNil(error, @"could not parse analysis JSON: %@", error);
  XCTAssertTrue([parsed isKindOfClass:[NSDictionary class]], @"analysis result is not an object");
  return (NSDictionary *)parsed;
}

- (void)testDecodeQRDecodesEncodedValue {
  NSString *text = kQRFixtureValue;
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self qrFixtureBase64]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"decodeQR\"}]"
                                                             error:&error];
  XCTAssertNil(error, @"decodeQR failed: %@", error);

  NSDictionary *parsed = [self parseDataResult:result];
  XCTAssertEqualObjects(parsed[@"found"], @YES);
  NSArray *codes = parsed[@"codes"];
  XCTAssertEqual(codes.count, 1u);
  XCTAssertEqualObjects(codes[0][@"value"], text);
  XCTAssertEqual([codes[0][@"corners"] count], 4u);
}

- (void)testDecodeQRRunsTransformsBeforeAnalysis {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self qrFixtureBase64]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"gray\"},{\"type\":\"decodeQR\"}]"
                                                             error:&error];
  XCTAssertNil(error, @"decodeQR failed: %@", error);

  NSDictionary *parsed = [self parseDataResult:result];
  XCTAssertEqualObjects(parsed[@"found"], @YES);
  XCTAssertEqualObjects(parsed[@"codes"][0][@"value"], kQRFixtureValue);
}

- (void)testDecodeQRReturnsNotFoundOnBlankImage {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"decodeQR\"}]"
                                                             error:&error];
  XCTAssertNil(error, @"decodeQR failed: %@", error);

  NSDictionary *parsed = [self parseDataResult:result];
  XCTAssertEqualObjects(parsed[@"found"], @NO);
  XCTAssertEqual([parsed[@"codes"] count], 0u);
}

- (void)testDataPipelineWithNoOpsFailsWithInvalidArgument {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[]"
                                                             error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testUnknownAnalysisOpFailsWithStableCode {
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"base64\",\"value\":\"%@\"}", [self sourceBase64:@".png"]];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"notAnAnalysis\"}]"
                                                             error:&error];
  XCTAssertNil(result);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorUnknownOp);
}

@end
