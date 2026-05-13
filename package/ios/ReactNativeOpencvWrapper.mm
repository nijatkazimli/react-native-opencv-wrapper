// Import OpenCV BEFORE any React/Foundation headers because some OpenCV
// headers (`<opencv2/...>`) are sensitive to macros that React Native pulls in
// (notably `NO` and `YES` from Objective-C, and `check` from Boost).
#ifdef __cplusplus
#import <opencv2/opencv.hpp>
#import <opencv2/imgcodecs.hpp>
#import <opencv2/imgproc.hpp>
#endif

#import "ReactNativeOpencvWrapper.h"

#import <string>

using cv::Mat;

static NSString *kErrorDomain = @"ReactNativeOpencvWrapper";

static std::string PathFromNSString(NSString *path) {
    return std::string([path UTF8String]);
}

static BOOL ProcessAndWrite(NSString *inputPath,
                            NSString *outputPath,
                            int imreadFlag,
                            void (^transform)(const Mat &src, Mat &dst),
                            NSError **error) {
    Mat src = cv::imread(PathFromNSString(inputPath), imreadFlag);
    if (src.empty()) {
        if (error) {
            *error = [NSError errorWithDomain:kErrorDomain
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey:
                                                    [NSString stringWithFormat:@"Could not read image at %@", inputPath]}];
        }
        return NO;
    }

    Mat dst;
    transform(src, dst);

    if (!cv::imwrite(PathFromNSString(outputPath), dst)) {
        if (error) {
            *error = [NSError errorWithDomain:kErrorDomain
                                         code:2
                                     userInfo:@{NSLocalizedDescriptionKey:
                                                    [NSString stringWithFormat:@"Could not write image to %@", outputPath]}];
        }
        return NO;
    }
    return YES;
}

@implementation ReactNativeOpencvWrapper

- (NSString *)getOpenCVVersion {
    return [NSString stringWithUTF8String:CV_VERSION];
}

- (void)toGray:(NSString *)inputPath
    outputPath:(NSString *)outputPath
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    BOOL ok = ProcessAndWrite(inputPath, outputPath, cv::IMREAD_COLOR,
        ^(const Mat &src, Mat &dst) {
            cv::cvtColor(src, dst, cv::COLOR_BGR2GRAY);
        }, &error);
    if (!ok) {
        reject(@"opencv_error", error.localizedDescription, error);
        return;
    }
    resolve(outputPath);
}

- (void)gaussianBlur:(NSString *)inputPath
          outputPath:(NSString *)outputPath
          kernelSize:(double)kernelSize
              sigmaX:(double)sigmaX
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    int k = (int)kernelSize;
    if (k < 1 || k % 2 == 0) {
        reject(@"opencv_error", @"kernelSize must be a positive odd integer", nil);
        return;
    }
    NSError *error = nil;
    BOOL ok = ProcessAndWrite(inputPath, outputPath, cv::IMREAD_COLOR,
        ^(const Mat &src, Mat &dst) {
            cv::GaussianBlur(src, dst, cv::Size(k, k), sigmaX);
        }, &error);
    if (!ok) {
        reject(@"opencv_error", error.localizedDescription, error);
        return;
    }
    resolve(outputPath);
}

- (void)canny:(NSString *)inputPath
   outputPath:(NSString *)outputPath
   threshold1:(double)threshold1
   threshold2:(double)threshold2
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    BOOL ok = ProcessAndWrite(inputPath, outputPath, cv::IMREAD_GRAYSCALE,
        ^(const Mat &src, Mat &dst) {
            cv::Canny(src, dst, threshold1, threshold2);
        }, &error);
    if (!ok) {
        reject(@"opencv_error", error.localizedDescription, error);
        return;
    }
    resolve(outputPath);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeReactNativeOpencvWrapperSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ReactNativeOpencvWrapper";
}

@end
