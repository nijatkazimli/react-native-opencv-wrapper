#ifdef __cplusplus
#import <opencv2/opencv.hpp>
#endif

#import "ReactNativeOpencvWrapper.h"

#import <algorithm>
#import <string>

using cv::Mat;

static NSString *kErrorDomain = @"ReactNativeOpencvWrapper";

static std::string PathFromNSString(NSString *path) {
    return std::string([path UTF8String]);
}

// ---------------------------------------------------------------------------
// Pipeline op dispatch
// ---------------------------------------------------------------------------
//
// Each pipeline op is a block that takes the current Mat and the op's JSON
// params, and returns the new Mat (or an empty Mat with `*error` populated on
// failure). To add a new op, append one entry to +pipelineOps below.
//
typedef Mat (^OpHandler)(const Mat &current, NSDictionary *params, NSError **error);

static NSError *MakeError(NSString *message) {
    return [NSError errorWithDomain:kErrorDomain
                               code:3
                           userInfo:@{NSLocalizedDescriptionKey: message}];
}

static Mat EnsureGray(const Mat &src) {
    if (src.channels() == 1) return src;
    Mat gray;
    cv::cvtColor(src, gray, cv::COLOR_BGR2GRAY);
    return gray;
}

static BOOL OddPositive(int k) {
    return k >= 1 && k % 2 == 1;
}

static int InterpolationFlag(NSString *name) {
    if ([name isEqualToString:@"nearest"]) return cv::INTER_NEAREST;
    if ([name isEqualToString:@"cubic"]) return cv::INTER_CUBIC;
    if ([name isEqualToString:@"area"]) return cv::INTER_AREA;
    return cv::INTER_LINEAR; // default / "linear"
}

static int ThresholdFlag(NSString *name) {
    if ([name isEqualToString:@"binaryInv"]) return cv::THRESH_BINARY_INV;
    if ([name isEqualToString:@"trunc"]) return cv::THRESH_TRUNC;
    if ([name isEqualToString:@"toZero"]) return cv::THRESH_TOZERO;
    if ([name isEqualToString:@"toZeroInv"]) return cv::THRESH_TOZERO_INV;
    return cv::THRESH_BINARY; // default / "binary"
}

static NSDictionary<NSString *, OpHandler> *PipelineOps(void) {
    static NSDictionary<NSString *, OpHandler> *ops;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        ops = @{
            @"gray": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                return EnsureGray(current);
            },
            @"gaussianBlur": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int k = [params[@"kernelSize"] intValue];
                double sigmaX = [params[@"sigmaX"] doubleValue];
                if (!OddPositive(k)) {
                    if (error) *error = MakeError(@"kernelSize must be a positive odd integer");
                    return Mat();
                }
                Mat dst;
                cv::GaussianBlur(current, dst, cv::Size(k, k), sigmaX);
                return dst;
            },
            @"canny": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                double t1 = [params[@"threshold1"] doubleValue];
                double t2 = [params[@"threshold2"] doubleValue];
                Mat dst;
                cv::Canny(EnsureGray(current), dst, t1, t2);
                return dst;
            },
            @"resize": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int w = [params[@"width"] intValue];
                int h = [params[@"height"] intValue];
                if (w < 1 || h < 1) {
                    if (error) *error = MakeError(@"resize width/height must be positive");
                    return Mat();
                }
                Mat dst;
                cv::resize(current, dst, cv::Size(w, h), 0, 0,
                           InterpolationFlag(params[@"interpolation"]));
                return dst;
            },
            @"crop": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int x = [params[@"x"] intValue];
                int y = [params[@"y"] intValue];
                int w = [params[@"width"] intValue];
                int h = [params[@"height"] intValue];
                if (x < 0 || y < 0 || w < 1 || h < 1 ||
                    x + w > current.cols || y + h > current.rows) {
                    if (error) *error = MakeError(@"crop rectangle is out of image bounds");
                    return Mat();
                }
                // clone() so the result owns its data independent of `current`.
                return current(cv::Rect(x, y, w, h)).clone();
            },
            @"rotate": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int angle = [params[@"angle"] intValue];
                int code;
                switch (angle) {
                    case 90: code = cv::ROTATE_90_CLOCKWISE; break;
                    case 180: code = cv::ROTATE_180; break;
                    case 270: code = cv::ROTATE_90_COUNTERCLOCKWISE; break;
                    default:
                        if (error) *error = MakeError(@"rotate angle must be 90, 180 or 270");
                        return Mat();
                }
                Mat dst;
                cv::rotate(current, dst, code);
                return dst;
            },
            @"flip": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                NSString *dir = params[@"direction"];
                int code;
                if ([dir isEqualToString:@"horizontal"]) code = 1;
                else if ([dir isEqualToString:@"vertical"]) code = 0;
                else if ([dir isEqualToString:@"both"]) code = -1;
                else {
                    if (error) *error = MakeError(@"flip direction must be horizontal, vertical or both");
                    return Mat();
                }
                Mat dst;
                cv::flip(current, dst, code);
                return dst;
            },
            @"threshold": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                double thresh = [params[@"thresh"] doubleValue];
                double maxValue = [params[@"maxValue"] doubleValue];
                Mat dst;
                cv::threshold(current, dst, thresh, maxValue,
                              ThresholdFlag(params[@"thresholdType"]));
                return dst;
            },
            @"medianBlur": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int k = [params[@"kernelSize"] intValue];
                if (!OddPositive(k)) {
                    if (error) *error = MakeError(@"kernelSize must be a positive odd integer");
                    return Mat();
                }
                Mat dst;
                cv::medianBlur(current, dst, k);
                return dst;
            },
            @"dilate": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int k = [params[@"kernelSize"] intValue];
                int iterations = [params[@"iterations"] intValue];
                if (!OddPositive(k)) {
                    if (error) *error = MakeError(@"kernelSize must be a positive odd integer");
                    return Mat();
                }
                Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(k, k));
                Mat dst;
                cv::dilate(current, dst, kernel, cv::Point(-1, -1), std::max(1, iterations));
                return dst;
            },
            @"erode": ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
                int k = [params[@"kernelSize"] intValue];
                int iterations = [params[@"iterations"] intValue];
                if (!OddPositive(k)) {
                    if (error) *error = MakeError(@"kernelSize must be a positive odd integer");
                    return Mat();
                }
                Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(k, k));
                Mat dst;
                cv::erode(current, dst, kernel, cv::Point(-1, -1), std::max(1, iterations));
                return dst;
            },
        };
    });
    return ops;
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

- (void)runPipeline:(NSString *)inputPath
         outputPath:(NSString *)outputPath
            opsJson:(NSString *)opsJson
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    NSData *data = [opsJson dataUsingEncoding:NSUTF8StringEncoding];
    NSError *jsonError = nil;
    id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError] : nil;
    if (!parsed || ![parsed isKindOfClass:[NSArray class]]) {
        reject(@"opencv_error",
               jsonError ? jsonError.localizedDescription : @"opsJson must be a JSON array",
               jsonError);
        return;
    }
    NSArray *ops = (NSArray *)parsed;
    NSDictionary<NSString *, OpHandler> *handlers = PipelineOps();

    Mat current = cv::imread(PathFromNSString(inputPath), cv::IMREAD_COLOR);
    if (current.empty()) {
        reject(@"opencv_error",
               [NSString stringWithFormat:@"Could not read image at %@", inputPath], nil);
        return;
    }

    for (NSUInteger i = 0; i < ops.count; i++) {
        id rawOp = ops[i];
        if (![rawOp isKindOfClass:[NSDictionary class]]) {
            reject(@"opencv_error",
                   [NSString stringWithFormat:@"Pipeline op #%lu is not an object", (unsigned long)i], nil);
            return;
        }
        NSDictionary *op = (NSDictionary *)rawOp;
        NSString *type = op[@"type"];
        if (![type isKindOfClass:[NSString class]]) {
            reject(@"opencv_error",
                   [NSString stringWithFormat:@"Pipeline op #%lu missing 'type'", (unsigned long)i], nil);
            return;
        }
        OpHandler handler = handlers[type];
        if (!handler) {
            reject(@"opencv_error",
                   [NSString stringWithFormat:@"Unknown pipeline op type '%@'", type], nil);
            return;
        }
        NSError *opError = nil;
        Mat next = handler(current, op, &opError);
        if (opError) {
            reject(@"opencv_error", opError.localizedDescription, opError);
            return;
        }
        current = next;
    }

    if (!cv::imwrite(PathFromNSString(outputPath), current)) {
        reject(@"opencv_error",
               [NSString stringWithFormat:@"Could not write image to %@", outputPath], nil);
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
