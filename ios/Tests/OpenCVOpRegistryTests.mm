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

- (void)testCvtColorBgrToHsvPreservesChannels {
  NSString *input = [self writeSourceImage:@"cvtcolor-in.png"];
  NSString *output = [self outputPath:@"cvtcolor-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"cvtColor\",\"code\":\"BGR2HSV\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testCvtColorBgrToGrayProducesSingleChannel {
  NSString *input = [self writeSourceImage:@"cvtcolor-gray-in.png"];
  NSString *output = [self outputPath:@"cvtcolor-gray-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"cvtColor\",\"code\":\"BGR2GRAY\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
}

- (void)testCvtColorInvalidCodeFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"cvtcolor-bad-in.png"];
  NSString *output = [self outputPath:@"cvtcolor-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"cvtColor\",\"code\":\"BGR2XYZZY\"}]"
                                             error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testInRangeProducesBinaryMask {
  NSString *input = [self writeSourceImage:@"inrange-in.png"];
  NSString *output = [self outputPath:@"inrange-out.png"];

  // Source pixel is (B=10, G=20, R=30); the bounds include it, so the mask is 255.
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"inRange\",\"lower\":[5,15,25],\"upper\":[15,25,35]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.at<uchar>(0, 0), 255);
}

- (void)testInRangeOutOfBoundsProducesZeroMask {
  NSString *input = [self writeSourceImage:@"inrange-zero-in.png"];
  NSString *output = [self outputPath:@"inrange-zero-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"inRange\",\"lower\":[100,100,100],\"upper\":[200,200,200]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.at<uchar>(0, 0), 0);
}

- (void)testInRangeMismatchedBoundsFailWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"inrange-bad-in.png"];
  NSString *output = [self outputPath:@"inrange-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"inRange\",\"lower\":[0,0],\"upper\":[255,255,255]}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testFilter2DIdentityKernelPreservesImage {
  NSString *input = [self writeSourceImage:@"filter2d-in.png"];
  NSString *output = [self outputPath:@"filter2d-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"filter2D\",\"kernel\":[[1]]}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testFilter2DRaggedKernelFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"filter2d-bad-in.png"];
  NSString *output = [self outputPath:@"filter2d-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"filter2D\",\"kernel\":[[1,2],[3]]}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testDebugWritesIntermediateAndPassesThrough {
  NSString *input = [self writeSourceImage:@"debug-in.png"];
  NSString *output = [self outputPath:@"debug-out.png"];
  NSString *capture = [self outputPath:@"debug-capture.png"];

  NSString *opsJson = [NSString stringWithFormat:
      @"[{\"type\":\"gray\"},{\"type\":\"debug\",\"path\":\"%@\"},{\"type\":\"canny\",\"threshold1\":50,\"threshold2\":150}]",
      capture];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:opsJson
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  // The capture is the grayscale intermediate (single channel).
  cv::Mat captured = [self readResult:capture];
  XCTAssertEqual(captured.channels(), 1);

  // The pipeline continued past debug to produce the canny edge map.
  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testDebugWithoutPathFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"debug-bad-in.png"];
  NSString *output = [self outputPath:@"debug-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"debug\"}]"
                                             error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testAdaptiveThresholdProducesSingleChannelBinary {
  NSString *input = [self writeSourceImage:@"adaptive-in.png"];
  NSString *output = [self outputPath:@"adaptive-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"adaptiveThreshold\",\"maxValue\":255,\"blockSize\":11,\"c\":2,\"method\":\"gaussian\",\"thresholdType\":\"binary\"}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  // A uniform image with C=2 keeps every pixel above its local mean → 255.
  XCTAssertEqual(result.at<uchar>(0, 0), 255);
}

- (void)testAdaptiveThresholdEvenBlockSizeFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"adaptive-bad-in.png"];
  NSString *output = [self outputPath:@"adaptive-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"adaptiveThreshold\",\"maxValue\":255,\"blockSize\":4,\"c\":2,\"method\":\"mean\",\"thresholdType\":\"binary\"}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testMorphologyExOpenPreservesUniformImage {
  NSString *input = [self writeSourceImage:@"morph-in.png"];
  NSString *output = [self outputPath:@"morph-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"morphologyEx\",\"operation\":\"open\",\"kernelSize\":3,\"iterations\":1}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testMorphologyExUnknownOperationFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"morph-bad-in.png"];
  NSString *output = [self outputPath:@"morph-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"morphologyEx\",\"operation\":\"spin\",\"kernelSize\":3,\"iterations\":1}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testBitwiseNotInvertsPixels {
  NSString *input = [self writeSourceImage:@"bitnot-in.png"];
  NSString *output = [self outputPath:@"bitnot-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"bitwiseNot\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  // (10, 20, 30) inverts to (245, 235, 225).
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 245);
  XCTAssertEqual(pixel[1], 235);
  XCTAssertEqual(pixel[2], 225);
}

- (void)testApplyMaskKeepsSelectedPixels {
  NSString *input = [self writeSourceImage:@"applymask-in.png"];
  NSString *output = [self outputPath:@"applymask-out.png"];

  // The sub-pipeline mask selects the source pixel (10,20,30), so the original
  // color flows through unchanged.
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"applyMask\",\"mask\":[{\"type\":\"inRange\",\"lower\":[5,15,25],\"upper\":[15,25,35]}]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testApplyMaskZeroesUnselectedPixels {
  NSString *input = [self writeSourceImage:@"applymask-zero-in.png"];
  NSString *output = [self outputPath:@"applymask-zero-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"applyMask\",\"mask\":[{\"type\":\"inRange\",\"lower\":[100,100,100],\"upper\":[200,200,200]}]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 0);
  XCTAssertEqual(pixel[2], 0);
}

- (void)testApplyMaskMultiChannelMaskFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"applymask-bad-in.png"];
  NSString *output = [self outputPath:@"applymask-bad-out.png"];

  // An empty sub-pipeline leaves the 3-channel clone untouched, which is not a
  // valid single-channel mask.
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"applyMask\",\"mask\":[]}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

#pragma mark - Drawing / annotation ops

- (void)testDrawRectStrokesBorderColor {
  NSString *input = [self writeSourceImage:@"drawrect-in.png"];
  NSString *output = [self outputPath:@"drawrect-out.png"];

  // color [r,g,b] = [250,20,10] → BGR Scalar(10,20,250).
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawRect\",\"x\":5,\"y\":10,\"width\":30,\"height\":40,\"color\":[250,20,10],\"thickness\":4}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // A pixel on the (axis-aligned) top edge carries the stroke color.
  cv::Vec3b pixel = result.at<cv::Vec3b>(10, 20);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 250);
}

- (void)testDrawRectZeroSizeFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"drawrect-bad-in.png"];
  NSString *output = [self outputPath:@"drawrect-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawRect\",\"x\":5,\"y\":5,\"width\":0,\"height\":10,\"color\":[255,0,0],\"thickness\":2}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testDrawCircleLeavesCenterHollow {
  NSString *input = [self writeSourceImage:@"drawcircle-in.png"];
  NSString *output = [self outputPath:@"drawcircle-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawCircle\",\"centerX\":20,\"centerY\":30,\"radius\":10,\"color\":[250,20,10],\"thickness\":2}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // The outline is hollow, so the center keeps the source color (10,20,30).
  cv::Vec3b center = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(center[0], 10);
  XCTAssertEqual(center[1], 20);
  XCTAssertEqual(center[2], 30);
}

- (void)testDrawCircleZeroRadiusFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"drawcircle-bad-in.png"];
  NSString *output = [self outputPath:@"drawcircle-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawCircle\",\"centerX\":20,\"centerY\":30,\"radius\":0,\"color\":[255,0,0],\"thickness\":2}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testDrawLineStrokesColor {
  NSString *input = [self writeSourceImage:@"drawline-in.png"];
  NSString *output = [self outputPath:@"drawline-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawLine\",\"x1\":0,\"y1\":30,\"x2\":39,\"y2\":30,\"color\":[250,20,10],\"thickness\":4}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 250);
}

- (void)testDrawLineZeroThicknessFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"drawline-bad-in.png"];
  NSString *output = [self outputPath:@"drawline-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawLine\",\"x1\":0,\"y1\":0,\"x2\":10,\"y2\":10,\"color\":[255,0,0],\"thickness\":0}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testPutTextPreservesDimensions {
  NSString *input = [self writeSourceImage:@"puttext-in.png"];
  NSString *output = [self outputPath:@"puttext-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"putText\",\"text\":\"Hi\",\"x\":2,\"y\":40,\"fontScale\":1,\"color\":[255,255,0],\"thickness\":2}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testPutTextEmptyTextFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"puttext-bad-in.png"];
  NSString *output = [self outputPath:@"puttext-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"putText\",\"text\":\"\",\"x\":2,\"y\":40,\"fontScale\":1,\"color\":[255,0,0],\"thickness\":2}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testDrawPolygonStrokesEdgeColor {
  NSString *input = [self writeSourceImage:@"drawpoly-in.png"];
  NSString *output = [self outputPath:@"drawpoly-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawPolygon\",\"points\":[[5,5],[35,5],[35,55],[5,55]],\"color\":[250,20,10],\"thickness\":4}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // The (axis-aligned) top edge between [5,5] and [35,5] carries the color.
  cv::Vec3b pixel = result.at<cv::Vec3b>(5, 20);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 250);
}

- (void)testDrawPolygonTooFewPointsFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"drawpoly-bad-in.png"];
  NSString *output = [self outputPath:@"drawpoly-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawPolygon\",\"points\":[[5,5]],\"color\":[255,0,0],\"thickness\":2}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testDrawRectFillColorFloodsInteriorAndStrokesBorder {
  NSString *input = [self writeSourceImage:@"drawrect-fill-in.png"];
  NSString *output = [self outputPath:@"drawrect-fill-out.png"];

  // Distinct stroke vs fill: stroke [12,34,56] -> BGR(56,34,12),
  // fillColor [250,20,10] -> BGR(10,20,250).
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawRect\",\"x\":5,\"y\":10,\"width\":30,\"height\":40,\"color\":[12,34,56],\"thickness\":2,\"fillColor\":[250,20,10]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  // The interior carries the fill color.
  cv::Vec3b interior = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(interior[0], 10);
  XCTAssertEqual(interior[1], 20);
  XCTAssertEqual(interior[2], 250);
  // The top edge still carries the (separate) stroke color.
  cv::Vec3b border = result.at<cv::Vec3b>(10, 20);
  XCTAssertEqual(border[0], 56);
  XCTAssertEqual(border[1], 34);
  XCTAssertEqual(border[2], 12);
}

- (void)testDrawCircleFillColorFloodsInterior {
  NSString *input = [self writeSourceImage:@"drawcircle-fill-in.png"];
  NSString *output = [self outputPath:@"drawcircle-fill-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawCircle\",\"centerX\":20,\"centerY\":30,\"radius\":10,\"color\":[12,34,56],\"thickness\":2,\"fillColor\":[250,20,10]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  // A filled disc paints its interior, so the center carries the fill color.
  cv::Vec3b center = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(center[0], 10);
  XCTAssertEqual(center[1], 20);
  XCTAssertEqual(center[2], 250);
}

- (void)testDrawCircleAliasedEdgesSucceed {
  NSString *input = [self writeSourceImage:@"drawcircle-alias-in.png"];
  NSString *output = [self outputPath:@"drawcircle-alias-out.png"];

  // antialias:false routes through LINE_8; result must still decode cleanly.
  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawCircle\",\"centerX\":20,\"centerY\":30,\"radius\":10,\"color\":[250,20,10],\"thickness\":2,\"antialias\":false}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testDrawPolygonFillColorFloodsInteriorAndStrokesEdge {
  NSString *input = [self writeSourceImage:@"drawpoly-fill-in.png"];
  NSString *output = [self outputPath:@"drawpoly-fill-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"drawPolygon\",\"points\":[[5,5],[35,5],[35,55],[5,55]],\"color\":[12,34,56],\"thickness\":2,\"fillColor\":[250,20,10]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  // An inside pixel carries the fill color.
  cv::Vec3b interior = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(interior[0], 10);
  XCTAssertEqual(interior[1], 20);
  XCTAssertEqual(interior[2], 250);
  // The (axis-aligned) top edge still carries the stroke color.
  cv::Vec3b border = result.at<cv::Vec3b>(5, 20);
  XCTAssertEqual(border[0], 56);
  XCTAssertEqual(border[1], 34);
  XCTAssertEqual(border[2], 12);
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
  return @"iVBORw0KGgoAAAANSUhEUgAAAN4AAADeCAAAAAB3DOFrAAALQklEQVR4Ad3BQaorOgLFQGn/i1ZzRgYT4vubN0qV8cuMX2b8MuOXGb/M+GXGLzN+mfHLjF9m/DLjlxm/zPhlxi8zfpnxy4xfZvwy45cZv8z4ZcYvM36Z8cuMX2b8MuOXGb/M+GXGLzN+mfHLjF9m/DLjlxlv8lcx8lmMHHGTv4o3403+KkY+i5EjbvJX8Wa8yV/FyGcxcsRN/irejDf5qxj5LEaOuMlfxZvxJn8VI5/FyBE3+at4M97kr2Lksxg54iZ/FW/Gm0x8IxOfyRHfyMQ3MvFmvMnENzLxmRzxjUx8IxNvxptMfCMTn8kR38jENzLxZrzJxDcy8Zkc8Y1MfCMTb8abTHwjE5/JEd/IxDcy8Wa8ycQ3MvGZHPGNTHwjE2/Gm0yM3GJk4pCJkYmRI0YmRiZGbjEy8Wa8ycTILUYmDpkYmRg5YmRiZGLkFiMTb8abTIzcYmTikImRiZEjRiZGJkZuMTLxZrzJxMgtRiYOmRiZGDliZGJkYuQWIxNvxptMjNxiZOKQiZGJkSNGJkYmRm4xMvFmvMnEyC1GJg6ZGJkYOWJkYmRi5BYjE2/Gm0yM3GJk4iZHHDJxk4mRW4xMvBlvMjFyi5GJmxxxyMRNJkZuMTLxZrzJxMgtRiZucsQhEzeZGLnFyMSb8SYTI7cYmbjJEYdM3GRi5BYjE2/Gm0yM3GJk4iZHHDJxk4mRW4xMvBlvMjFyi5GJmxxxyMRNJkZuMTLxZrzJxMgtRiZu8k2MTIxMjNxiZOLNeJOJkVuMTNzkmxiZGJkYucXIxJvxJhMjtxiZuMk3MTIxMjFyi5GJN+NNJkZuMTJxk29iZGJkYuQWIxNvxptMjNxiZOIm38TIxMjEyC1GJt6MN5kYucXIxE2+iZGJkYmRW4xMvBlvMvGNTBwyMTIxcsRNJr6RiTfjTSa+kYlDJkYmRo64ycQ3MvFmvMnENzJxyMTIxMgRN5n4RibejDeZ+EYmDpkYmRg54iYT38jEm/EmE9/IxCETIxMjR9xk4huZeDPeZOIbmThkYmRi5IibTHwjE2/Gm/xVjEyMTIxMjEyMTIz8VbwZb/JXMTIxMjEyMTIxMjHyV/FmvMlfxcjEyMTIxMjEyMTIX8Wb8SZ/FSMTIxMjEyMTIxMjfxVvxpv8VYxMjEyMTIxMjEyM/FW8GW/yVzEyMTIxMjEyMTIx8lfxZvx7csQhEyO3+PeMf0+OOGRi5Bb/nvHvyRGHTIzc4t8z/j054pCJkVv8e8a/J0ccMjFyi3/P+PfkiEMmRm7x7xlvcsTIESMTh0wccouRiZGJb2TizXiTI0aOGJk4ZOKQW4xMjEx8IxNvxpscMXLEyMQhE4fcYmRiZOIbmXgz3uSIkSNGJg6ZOOQWIxMjE9/IxJvxJkeMHDEyccjEIbcYmRiZ+EYm3ow3OWLkiJGJQyYOucXIxMjENzLxZrzJLT6TiUMmbnLEyMTIN/FXxpvc4jOZOGTiJkeMTIx8E39lvMktPpOJQyZucsTIxMg38VfGm9ziM5k4ZOImR4xMjHwTf2W8yS0+k4lDJm5yxMjEyDfxV8ab3OIzmThk4iZHjEyMfBN/ZfyV3GLkiJEjDpkYOWLkFiMTh0y8GX8ltxg5YuSIQyZGjhi5xcjEIRNvxl/JLUaOGDnikImRI0ZuMTJxyMSb8Vdyi5EjRo44ZGLkiJFbjEwcMvFm/JXcYuSIkSMOmRg5YuQWIxOHTLwZfyW3GDli5IhDJkaOGLnFyMQhE2/Gm0zcZOKQiTc5YuS/iTfjTSZuMnHIxJscMfLfxJvxJhM3mThk4k2OGPlv4s14k4mbTBwy8SZHjPw38Wa8ycRNJg6ZeJMjRv6beDPeZOImE4dMvMkRI/9NvBlvMjFyxMhbHHLEyMTIEZ/JxJvxJhMjR4y8xSFHjEyMHPGZTLwZbzIxcsTIWxxyxMjEyBGfycSb8SYTI0eMvMUhR4xMjBzxmUy8GW8yMXLEyFsccsTIxMgRn8nEm/EmEyNHjLzFIUeMTIwc8ZlMvBlvMjHyWRxyi5GJQyY+k4lDJv7KeJOJkc/ikFuMTBwy8ZlMHDLxV8abTIx8FofcYmTikInPZOKQib8y3mRi5LM45BYjE4dMfCYTh0z8lfEmEyOfxSG3GJk4ZOIzmThk4q+MN5kY+SwOucXIxCETn8nEIRN/ZbzJLW5yxJt8EyPfxJvxJre4yRFv8k2MfBNvxpvc4iZHvMk3MfJNvBlvcoubHPEm38TIN/FmvMktbnLEm3wTI9/Em/Emt7jJEW/yTYx8E2/Gm0wccsRncsTIZzFyi5EjRibejDeZOOSIz+SIkc9i5BYjR4xMvBlvMnHIEZ/JESOfxcgtRo4YmXgz3mTikCM+kyNGPouRW4wcMTLxZrzJxCFHfCZHjHwWI7cYOWJk4s14k4lDjvhMjhj5LEZuMXLEyMSb8SafxSETIxOHHHHIW4wc8VfGm3wWh0yMTBxyxCFvMXLEXxlv8lkcMjEyccgRh7zFyBF/ZbzJZ3HIxMjEIUcc8hYjR/yV8SafxSETIxOHHHHIW4wc8VfGm3wWh0yMTBxyxCFvMXLEXxn/nhwxMnGTI24yMXLEXxn/nhwxMnGTI24yMXLEXxn/nhwxMnGTI24yMXLEXxn/nhwxMnGTI24yMXLEXxn/nhwxMnGTI24yMXLEXxn/nhwxMnGTI24yMXLEXxlv8ldxyBEjtxiZGJkYmbjJxJvxJn8VhxwxcouRiZGJkYmbTLwZb/JXccgRI7cYmRiZGJm4ycSb8SZ/FYccMXKLkYmRiZGJm0y8GW/yV3HIESO3GJkYmRiZuMnEm/EmfxWHHDFyi5GJkYmRiZtMvBlvMvGNTBxyi5GJkSNuMvH/M95k4huZOOQWIxMjR9xk4v9nvMnENzJxyC1GJkaOuMnE/894k4lvZOKQW4xMjBxxk4n/n/EmE9/IxCG3GJkYOeImE/8/400mvpGJQ24xMjFyxE0m/n/Gm0yM3GJkYmRi5IiRiZG3uMnEm/EmEyO3GJkYmRg5YmRi5C1uMvFmvMnEyC1GJkYmRo4YmRh5i5tMvBlvMjFyi5GJkYmRI0YmRt7iJhNvxptMjNxiZGJkYuSIkYmRt7jJxJvxJhMjtxiZGJkYOWJkYuQtbjLxZrzJxMgtRiZGbjFyxMjEyBGfyRFvxptMjNxiZGLkFiNHjEyMHPGZHPFmvMnEyC1GJkZuMXLEyMTIEZ/JEW/Gm0yM3GJkYuQWI0eMTIwc8Zkc8Wa8ycTILUYmRm4xcsTIxMgRn8kRb8abTIzcYmRi5BYjR4xMjBzxmRzxZrzJxMgtRiZucsTIxMjEyMQh38Sb8SYTI7cYmbjJESMTIxMjE4d8E2/Gm0yM3GJk4iZHjEyMTIxMHPJNvBlvMjFyi5GJmxwxMjEyMTJxyDfxZrzJxMgtRiZucsTIxMjEyMQh38Sb8SYTI7cYmbjJESMTIxMjE4d8E2/Gm0x8IxMjEyOfxTdyxMgt3ow3mfhGJkYmRj6Lb+SIkVu8GW8y8Y1MjEyMfBbfyBEjt3gz3mTiG5kYmRj5LL6RI0Zu8Wa8ycQ3MjEyMfJZfCNHjNzizXiTiW9kYmRi5LP4Ro4YucWb8SZ/FSMTh9zikCNuMnHIxJvxJn8VIxOH3OKQI24yccjEm/EmfxUjE4fc4pAjbjJxyMSb8SZ/FSMTh9zikCNuMnHIxJvxJn8VIxOH3OKQI24yccjEm/EmfxUjE4fc4pAjbjJxyMSb8cuMX2b8MuOXGb/M+GXGLzN+mfHLjF9m/DLjlxm/zPhlxi8zfpnxy4xfZvwy45cZv8z4ZcYvM36Z8cuMX2b8MuOXGb/M+GXGLzN+mfHLjF9m/DLjl/0Pv+O2PSNqXWwAAAAASUVORK5CYII=";
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

#pragma mark - Document scanning (scanDocument)

// Render a bright, skewed quadrilateral "document" on a dark background and
// return its file path. The quad is deliberately non-axis-aligned so the
// perspective correction has something to undo.
- (NSString *)writeDocumentImage:(NSString *)name {
  cv::Mat canvas(240, 320, CV_8UC3, cv::Scalar(15, 15, 15));
  std::vector<cv::Point> quad = {
      cv::Point(60, 30),
      cv::Point(280, 55),
      cv::Point(265, 210),
      cv::Point(45, 195),
  };
  cv::fillConvexPoly(canvas, quad, cv::Scalar(235, 240, 245));
  NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:name];
  bool ok = cv::imwrite(path.UTF8String, canvas);
  XCTAssertTrue(ok, @"failed to write document image");
  return path;
}

- (void)testScanDocumentRectifiesDetectedQuad {
  NSString *input = [self writeDocumentImage:@"scan-in.png"];
  NSString *output = [self outputPath:@"scan-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"scanDocument\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"scanDocument failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertGreaterThan(result.cols, 100);
  XCTAssertGreaterThan(result.rows, 100);
}

- (void)testScanDocumentFailsWhenNoDocument {
  NSString *input = [self writeSourceImage:@"scan-blank-in.png"];
  NSString *output = [self outputPath:@"scan-blank-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"scanDocument\"}]"
                                             error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorDocumentNotFound);
}

- (void)testScanDocumentBwModeProducesBinaryImage {
  NSString *input = [self writeDocumentImage:@"scan-bw-in.png"];
  NSString *output = [self outputPath:@"scan-bw-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"scanDocument\",\"mode\":\"bw\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"scanDocument bw failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  // Adaptive threshold yields a strictly black-or-white image.
  for (int r = 0; r < result.rows; r++) {
    for (int c = 0; c < result.cols; c++) {
      uchar v = result.at<uchar>(r, c);
      XCTAssertTrue(v == 0 || v == 255, @"non-binary pixel %d", v);
    }
  }
}

- (void)testScanDocumentAspectRatioOverridesOutputSize {
  NSString *input = [self writeDocumentImage:@"scan-ar-in.png"];
  NSString *output = [self outputPath:@"scan-ar-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"scanDocument\",\"aspectRatio\":2.0}]"
                     error:&error];
  XCTAssertTrue(ok, @"scanDocument aspectRatio failed: %@", error);

  cv::Mat result = [self readResult:output];
  double ratio = (double)result.cols / (double)result.rows;
  XCTAssertEqualWithAccuracy(ratio, 2.0, 0.05);
}

#pragma mark - Document detection (detectDocument)

- (void)testDetectDocumentReturnsFourOrderedCorners {
  NSString *input = [self writeDocumentImage:@"detect-in.png"];
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"path\",\"value\":\"%@\"}", input];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"detectDocument\"}]"
                                                             error:&error];
  XCTAssertNil(error, @"detectDocument failed: %@", error);

  NSDictionary *parsed = [self parseDataResult:result];
  XCTAssertEqualObjects(parsed[@"found"], @YES);
  NSArray *corners = parsed[@"corners"];
  XCTAssertEqual(corners.count, 4u);
  XCTAssertEqualObjects(parsed[@"width"], @320);
  XCTAssertEqualObjects(parsed[@"height"], @240);
  // Corners are ordered tl, tr, br, bl.
  double tlx = [corners[0][@"x"] doubleValue], tly = [corners[0][@"y"] doubleValue];
  double brx = [corners[2][@"x"] doubleValue], bry = [corners[2][@"y"] doubleValue];
  XCTAssertLessThan(tlx, brx);
  XCTAssertLessThan(tly, bry);
}

- (void)testDetectDocumentReturnsNotFoundOnBlankImage {
  NSString *input = [self writeSourceImage:@"detect-blank-in.png"];
  NSString *inputJson =
      [NSString stringWithFormat:@"{\"kind\":\"path\",\"value\":\"%@\"}", input];

  NSError *error = nil;
  NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                           opsJson:@"[{\"type\":\"detectDocument\"}]"
                                                             error:&error];
  XCTAssertNil(error, @"detectDocument failed: %@", error);

  NSDictionary *parsed = [self parseDataResult:result];
  XCTAssertEqualObjects(parsed[@"found"], @NO);
  XCTAssertEqual([parsed[@"corners"] count], 0u);
}

#pragma mark - Geometric & photometric ops

- (void)testWarpPerspectiveIdentityPreservesImage {
  NSString *input = [self writeSourceImage:@"warpp-in.png"];
  NSString *output = [self outputPath:@"warpp-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"warpPerspective\",\"srcPoints\":[[0,0],[40,0],[40,60],[0,60]],\"dstPoints\":[[0,0],[40,0],[40,60],[0,60]],\"width\":40,\"height\":60}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testWarpPerspectiveWrongPointCountFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"warpp-bad-in.png"];
  NSString *output = [self outputPath:@"warpp-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"warpPerspective\",\"srcPoints\":[[0,0],[40,0],[40,60]],\"dstPoints\":[[0,0],[40,0],[40,60]]}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testWarpAffineIdentityPreservesImage {
  NSString *input = [self writeSourceImage:@"warpa-in.png"];
  NSString *output = [self outputPath:@"warpa-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"warpAffine\",\"srcPoints\":[[0,0],[40,0],[0,60]],\"dstPoints\":[[0,0],[40,0],[0,60]],\"width\":40,\"height\":60}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testBlendWithIdenticalSourcePreservesImage {
  NSString *input = [self writeSourceImage:@"blend-in.png"];
  NSString *output = [self outputPath:@"blend-out.png"];
  NSString *source = [self sourceBase64:@".png"];

  NSString *opsJson = [NSString stringWithFormat:
      @"[{\"type\":\"blend\",\"source\":\"%@\",\"alpha\":0.5,\"beta\":0.5,\"gamma\":0}]",
      source];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:opsJson
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  // 0.5 * (10,20,30) + 0.5 * (10,20,30) == (10,20,30).
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testEqualizeHistProducesSingleChannelImage {
  NSString *input = [self writeSourceImage:@"equalize-in.png"];
  NSString *output = [self outputPath:@"equalize-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:@"[{\"type\":\"equalizeHist\"}]"
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testClaheProducesSingleChannelImage {
  NSString *input = [self writeSourceImage:@"clahe-in.png"];
  NSString *output = [self outputPath:@"clahe-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"clahe\",\"clipLimit\":2,\"tileGridSize\":8}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 1);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testBilateralFilterPreservesShape {
  NSString *input = [self writeSourceImage:@"bilateral-in.png"];
  NSString *output = [self outputPath:@"bilateral-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"bilateralFilter\",\"diameter\":5,\"sigmaColor\":50,\"sigmaSpace\":50}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // A uniform region is unchanged by edge-preserving smoothing.
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 10);
  XCTAssertEqual(pixel[1], 20);
  XCTAssertEqual(pixel[2], 30);
}

- (void)testCopyMakeBorderEnlargesImage {
  NSString *input = [self writeSourceImage:@"border-in.png"];
  NSString *output = [self outputPath:@"border-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"copyMakeBorder\",\"top\":5,\"bottom\":5,\"left\":5,\"right\":5,\"borderType\":\"constant\",\"color\":[0,0,0]}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth + 10);
  XCTAssertEqual(result.rows, kHeight + 10);
  // The constant border is black; the inner region keeps the source pixel.
  cv::Vec3b border = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(border[0], 0);
  XCTAssertEqual(border[1], 0);
  XCTAssertEqual(border[2], 0);
  cv::Vec3b inner = result.at<cv::Vec3b>(30, 25);
  XCTAssertEqual(inner[0], 10);
  XCTAssertEqual(inner[1], 20);
  XCTAssertEqual(inner[2], 30);
}

- (void)testNormalizePreservesShape {
  NSString *input = [self writeSourceImage:@"normalize-in.png"];
  NSString *output = [self outputPath:@"normalize-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"normalize\",\"alpha\":0,\"beta\":255,\"normType\":\"minmax\"}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
}

- (void)testConvertScaleAbsScalesPixelValues {
  NSString *input = [self writeSourceImage:@"convert-in.png"];
  NSString *output = [self outputPath:@"convert-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"convertScaleAbs\",\"alpha\":2,\"beta\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  // |2 * (10,20,30) + 0| == (20,40,60).
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 20);
  XCTAssertEqual(pixel[1], 40);
  XCTAssertEqual(pixel[2], 60);
}

- (void)testLutAppliesInverseTable {
  NSString *input = [self writeSourceImage:@"lut-in.png"];
  NSString *output = [self outputPath:@"lut-out.png"];

  NSMutableString *table = [NSMutableString stringWithString:@"["];
  for (int i = 0; i < 256; i++) {
    if (i > 0) [table appendString:@","];
    [table appendFormat:@"%d", 255 - i];
  }
  [table appendString:@"]"];
  NSString *opsJson =
      [NSString stringWithFormat:@"[{\"type\":\"lut\",\"table\":%@}]", table];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry runPipelineWithInput:input
                                            output:output
                                           opsJson:opsJson
                                             error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  // table[x] = 255 - x maps (10,20,30) -> (245,235,225).
  cv::Vec3b pixel = result.at<cv::Vec3b>(0, 0);
  XCTAssertEqual(pixel[0], 245);
  XCTAssertEqual(pixel[1], 235);
  XCTAssertEqual(pixel[2], 225);
}

#pragma mark - Gradient ops

- (void)testSobelOnUniformImageProducesZeros {
  NSString *input = [self writeSourceImage:@"sobel-in.png"];
  NSString *output = [self outputPath:@"sobel-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"sobel\",\"dx\":1,\"dy\":0,\"ksize\":3,\"scale\":1,\"delta\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // A flat image has no gradient, so the absolute derivative is zero.
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 0);
  XCTAssertEqual(pixel[2], 0);
}

- (void)testSobelEvenKsizeFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"sobel-bad-in.png"];
  NSString *output = [self outputPath:@"sobel-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"sobel\",\"dx\":1,\"dy\":0,\"ksize\":4}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testScharrOnUniformImageProducesZeros {
  NSString *input = [self writeSourceImage:@"scharr-in.png"];
  NSString *output = [self outputPath:@"scharr-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"scharr\",\"dx\":0,\"dy\":1,\"scale\":1,\"delta\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 0);
  XCTAssertEqual(pixel[2], 0);
}

- (void)testScharrInvalidDerivativeOrderFailsWithInvalidArgument {
  NSString *input = [self writeSourceImage:@"scharr-bad-in.png"];
  NSString *output = [self outputPath:@"scharr-bad-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"scharr\",\"dx\":1,\"dy\":1}]"
                     error:&error];
  XCTAssertFalse(ok);
  XCTAssertNotNil(error);
  XCTAssertEqualObjects(error.userInfo[OpenCVErrorCodeKey], OpenCVErrorInvalidArgument);
}

- (void)testLaplacianOnUniformImageProducesZeros {
  NSString *input = [self writeSourceImage:@"laplacian-in.png"];
  NSString *output = [self outputPath:@"laplacian-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"laplacian\",\"ksize\":3,\"scale\":1,\"delta\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 0);
  XCTAssertEqual(pixel[2], 0);
}

- (void)testSepFilter2DOnUniformImageWithZeroSumKernel {
  NSString *input = [self writeSourceImage:@"sep-in.png"];
  NSString *output = [self outputPath:@"sep-out.png"];

  NSError *error = nil;
  BOOL ok = [OpenCVOpRegistry
      runPipelineWithInput:input
                    output:output
                   opsJson:@"[{\"type\":\"sepFilter2D\",\"kernelX\":[1,0,-1],\"kernelY\":[1,2,1],\"delta\":0}]"
                     error:&error];
  XCTAssertTrue(ok, @"pipeline failed: %@", error);

  cv::Mat result = [self readResult:output];
  XCTAssertEqual(result.channels(), 3);
  XCTAssertEqual(result.cols, kWidth);
  XCTAssertEqual(result.rows, kHeight);
  // kernelX = [1,0,-1] sums to zero, so a flat image yields zeros.
  cv::Vec3b pixel = result.at<cv::Vec3b>(30, 20);
  XCTAssertEqual(pixel[0], 0);
  XCTAssertEqual(pixel[1], 0);
  XCTAssertEqual(pixel[2], 0);
}

@end
