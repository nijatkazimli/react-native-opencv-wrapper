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

@end
