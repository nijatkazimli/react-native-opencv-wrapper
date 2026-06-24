#ifdef __cplusplus
#import <opencv2/opencv.hpp>
#endif

#import "ReactNativeOpencvWrapper.h"

#import "pipeline/OpenCVOpRegistry.h"

/// Reject a promise with the stable code carried by `error` (falling back to a
/// generic code), so JS callers can branch on the failure kind.
static void OpenCVReject(RCTPromiseRejectBlock reject, NSError *error) {
    NSString *code = error.userInfo[OpenCVErrorCodeKey];
    reject(code.length ? code : @"opencv_error", error.localizedDescription, error);
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
    BOOL ok = [OpenCVOpRegistry runSingleOpWithInput:inputPath
                                               output:outputPath
                                               opName:@"gray"
                                               params:@{}
                                                error:&error];
    if (!ok) {
        OpenCVReject(reject, error);
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
        reject(OpenCVErrorInvalidArgument, @"kernelSize must be a positive odd integer", nil);
        return;
    }
    NSError *error = nil;
    BOOL ok = [OpenCVOpRegistry runSingleOpWithInput:inputPath
                                               output:outputPath
                                               opName:@"gaussianBlur"
                                               params:@{ @"kernelSize": @(k), @"sigmaX": @(sigmaX) }
                                                error:&error];
    if (!ok) {
        OpenCVReject(reject, error);
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
    BOOL ok = [OpenCVOpRegistry runSingleOpWithInput:inputPath
                                               output:outputPath
                                               opName:@"canny"
                                               params:@{ @"threshold1": @(threshold1), @"threshold2": @(threshold2) }
                                                error:&error];
    if (!ok) {
        OpenCVReject(reject, error);
        return;
    }
    resolve(outputPath);
}

- (void)runPipeline:(NSString *)inputPath
         outputPath:(NSString *)outputPath
            opsJson:(NSString *)opsJson
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    BOOL ok = [OpenCVOpRegistry runPipelineWithInput:inputPath
                                              output:outputPath
                                             opsJson:opsJson
                                               error:&error];
    if (!ok) {
        OpenCVReject(reject, error);
        return;
    }
    resolve(outputPath);
}

- (void)runPipelineIO:(NSString *)inputJson
           outputJson:(NSString *)outputJson
              opsJson:(NSString *)opsJson
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    NSString *result = [OpenCVOpRegistry runPipelineWithInputJson:inputJson
                                                       outputJson:outputJson
                                                          opsJson:opsJson
                                                            error:&error];
    if (result == nil) {
        OpenCVReject(reject, error);
        return;
    }
    resolve(result);
}

- (void)runPipelineData:(NSString *)inputJson
                opsJson:(NSString *)opsJson
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    NSString *result = [OpenCVOpRegistry runPipelineDataWithInputJson:inputJson
                                                             opsJson:opsJson
                                                               error:&error];
    if (result == nil) {
        OpenCVReject(reject, error);
        return;
    }
    resolve(result);
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
