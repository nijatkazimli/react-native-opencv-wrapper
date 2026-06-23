#import "OpenCVOpRegistry.h"

#import <string>

using cv::Mat;

static NSString *const kOpenCVErrorDomain = @"ReactNativeOpencvWrapper";

NSString *const OpenCVErrorCodeKey = @"OpenCVErrorCode";
NSString *const OpenCVErrorInvalidArgument = @"opencv_invalid_argument";
NSString *const OpenCVErrorIO = @"opencv_io_error";
NSString *const OpenCVErrorUnknownOp = @"opencv_unknown_op";
NSString *const OpenCVErrorUnavailable = @"opencv_unavailable";

NSError *OpenCVMakeCodedError(NSString *code, NSString *message) {
    return [NSError errorWithDomain:kOpenCVErrorDomain
                               code:3
                           userInfo:@{
                               NSLocalizedDescriptionKey: message ?: @"OpenCV error",
                               OpenCVErrorCodeKey: code ?: OpenCVErrorInvalidArgument,
                           }];
}

NSError *OpenCVMakeError(NSString *message) {
    return OpenCVMakeCodedError(OpenCVErrorInvalidArgument, message);
}

BOOL OpenCVRequireNumbers(NSDictionary *params,
                          NSArray<NSString *> *keys,
                          NSError **error) {
    for (NSString *key in keys) {
        id value = params[key];
        if (![value isKindOfClass:[NSNumber class]]) {
            if (error) {
                *error = OpenCVMakeCodedError(
                    OpenCVErrorInvalidArgument,
                    [NSString stringWithFormat:@"param '%@' is required and must be a number", key]);
            }
            return NO;
        }
    }
    return YES;
}

NSString *OpenCVOptionalString(NSDictionary *params, NSString *key) {
    id value = params[key];
    return [value isKindOfClass:[NSString class]] ? (NSString *)value : nil;
}

Mat OpenCVEnsureGray(const Mat &src) {
    if (src.channels() == 1) return src;
    Mat gray;
    cv::cvtColor(src, gray, cv::COLOR_BGR2GRAY);
    return gray;
}

BOOL OpenCVOddPositive(int k) {
    return k >= 1 && k % 2 == 1;
}

static std::string OpenCVPath(NSString *path) {
    return std::string([path UTF8String]);
}

@implementation OpenCVOpRegistry

+ (NSMutableDictionary<NSString *, OpenCVOpHandler> *)registry {
    static NSMutableDictionary<NSString *, OpenCVOpHandler> *registry;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        registry = [NSMutableDictionary dictionary];
    });
    return registry;
}

+ (void)registerOp:(NSString *)name handler:(OpenCVOpHandler)handler {
    if (name.length == 0 || handler == nil) return;
    @synchronized ([self registry]) {
        [self registry][name] = [handler copy];
    }
}

+ (OpenCVOpHandler)handlerForName:(NSString *)name {
    @synchronized ([self registry]) {
        return [self registry][name];
    }
}

+ (BOOL)runPipelineWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                     opsJson:(NSString *)opsJson
                       error:(NSError **)error {
    NSData *data = [opsJson dataUsingEncoding:NSUTF8StringEncoding];
    NSError *jsonError = nil;
    id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError] : nil;
    if (![parsed isKindOfClass:[NSArray class]]) {
        if (error) {
            *error = jsonError ?: OpenCVMakeError(@"opsJson must be a JSON array");
        }
        return NO;
    }
    NSArray *ops = (NSArray *)parsed;

    Mat current = cv::imread(OpenCVPath(inputPath), cv::IMREAD_COLOR);
    if (current.empty()) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not read image at %@", inputPath]);
        }
        return NO;
    }

    for (NSUInteger i = 0; i < ops.count; i++) {
        id rawOp = ops[i];
        if (![rawOp isKindOfClass:[NSDictionary class]]) {
            if (error) {
                *error = OpenCVMakeError([NSString stringWithFormat:@"Pipeline op #%lu is not an object", (unsigned long)i]);
            }
            return NO;
        }
        NSDictionary *op = (NSDictionary *)rawOp;
        NSString *type = op[@"type"];
        if (![type isKindOfClass:[NSString class]]) {
            if (error) {
                *error = OpenCVMakeError([NSString stringWithFormat:@"Pipeline op #%lu missing 'type'", (unsigned long)i]);
            }
            return NO;
        }
        OpenCVOpHandler handler = [self handlerForName:type];
        if (handler == nil) {
            if (error) {
                *error = OpenCVMakeCodedError(OpenCVErrorUnknownOp,
                    [NSString stringWithFormat:@"Unknown pipeline op type '%@'", type]);
            }
            return NO;
        }
        NSError *opError = nil;
        Mat next = handler(current, op, &opError);
        if (opError != nil) {
            if (error) *error = opError;
            return NO;
        }
        current = next;
    }

    if (!cv::imwrite(OpenCVPath(outputPath), current)) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not write image to %@", outputPath]);
        }
        return NO;
    }
    return YES;
}

+ (BOOL)runSingleOpWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                      opName:(NSString *)opName
                      params:(NSDictionary *)params
                       error:(NSError **)error {
    NSMutableDictionary *op = [NSMutableDictionary dictionaryWithDictionary:params ?: @{}];
    op[@"type"] = opName;

    NSError *jsonError = nil;
    NSData *data = [NSJSONSerialization dataWithJSONObject:@[op] options:0 error:&jsonError];
    if (!data) {
        if (error) *error = jsonError ?: OpenCVMakeError(@"Could not encode op JSON");
        return NO;
    }

    NSString *opsJson = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (!opsJson) {
        if (error) *error = OpenCVMakeError(@"Could not encode op JSON");
        return NO;
    }

    return [self runPipelineWithInput:inputPath output:outputPath opsJson:opsJson error:error];
}

@end
