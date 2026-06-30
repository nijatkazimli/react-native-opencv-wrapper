#import "OpenCVOpRegistry.h"

#import <algorithm>
#import <string>
#import <vector>

using cv::Mat;

static NSString *const kOpenCVErrorDomain = @"ReactNativeOpencvWrapper";

NSString *const OpenCVErrorCodeKey = @"OpenCVErrorCode";
NSString *const OpenCVErrorInvalidArgument = @"opencv_invalid_argument";
NSString *const OpenCVErrorIO = @"opencv_io_error";
NSString *const OpenCVErrorUnknownOp = @"opencv_unknown_op";
NSString *const OpenCVErrorUnavailable = @"opencv_unavailable";
NSString *const OpenCVErrorDocumentNotFound = @"opencv_document_not_found";

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

BOOL OpenCVRunKmeansBgr(const Mat &current, NSDictionary *params,
                        int defaultK, NSString *opName,
                        OpenCVKmeansResult *out, NSError **error) {
    int k = params[@"k"] ? [params[@"k"] intValue] : defaultK;
    if (k < 1) {
        if (error) *error = OpenCVMakeError([NSString stringWithFormat:@"%@ 'k' must be >= 1", opName]);
        return NO;
    }
    int attempts = params[@"attempts"] ? [params[@"attempts"] intValue] : 3;
    if (attempts < 1) { attempts = 1; }
    int iterations = params[@"iterations"] ? [params[@"iterations"] intValue] : 10;
    if (iterations < 1) { iterations = 1; }

    Mat img;
    if (current.channels() == 1) {
        cv::cvtColor(current, img, cv::COLOR_GRAY2BGR);
    } else {
        img = current;
    }

    int sampleCount = img.rows * img.cols;
    if (k > sampleCount) { k = sampleCount; }

    Mat data;
    img.convertTo(data, CV_32F);
    data = data.reshape(1, sampleCount);  // sampleCount x 3

    Mat labels, centers;
    cv::TermCriteria crit(cv::TermCriteria::EPS + cv::TermCriteria::MAX_ITER,
                          iterations, 1.0);
    cv::kmeans(data, k, labels, crit, attempts, cv::KMEANS_PP_CENTERS, centers);

    out->labels = labels;
    out->centers = centers;
    out->k = k;
    out->sampleCount = sampleCount;
    return YES;
}

BOOL OpenCVOddPositive(int k) {
    return k >= 1 && k % 2 == 1;
}

cv::Scalar OpenCVColorScalar(NSArray *color, cv::Scalar fallback) {
    if (![color isKindOfClass:[NSArray class]] || color.count < 3) return fallback;
    double rgb[3];
    for (NSUInteger i = 0; i < 3; i++) {
        id component = color[i];
        if (![component isKindOfClass:[NSNumber class]]) return fallback;
        rgb[i] = [component doubleValue];
    }
    return cv::Scalar(rgb[2], rgb[1], rgb[0]);  // RGB -> BGR
}

BOOL OpenCVAntialias(NSDictionary *params) {
    return params[@"antialias"] ? [params[@"antialias"] boolValue] : YES;
}

BOOL OpenCVResolveDrawStyle(NSDictionary *params, NSString *opName,
                            OpenCVDrawStyle *out, NSError **error) {
    int thickness = [params[@"thickness"] intValue];
    if (thickness < 1) {
        if (error) *error = OpenCVMakeError([NSString stringWithFormat:@"%@ 'thickness' must be >= 1", opName]);
        return NO;
    }
    out->color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 255));
    out->thickness = thickness;
    out->lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;
    out->hasFill = [params[@"fillColor"] isKindOfClass:[NSArray class]];
    out->fillColor = out->hasFill ? OpenCVColorScalar(params[@"fillColor"], out->color)
                                  : out->color;
    return YES;
}

static std::string OpenCVPath(NSString *path) {
    return std::string([path UTF8String]);
}

/// Parse a JSON object string (input/output descriptor) into an NSDictionary.
static NSDictionary *OpenCVParseObject(NSString *json, NSError **error) {
    NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
    NSError *jsonError = nil;
    id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError] : nil;
    if (![parsed isKindOfClass:[NSDictionary class]]) {
        if (error) *error = jsonError ?: OpenCVMakeError(@"I/O descriptor must be a JSON object");
        return nil;
    }
    return (NSDictionary *)parsed;
}

/// Parse a JSON array string of ops into an NSArray.
static NSArray *OpenCVParseOps(NSString *opsJson, NSError **error) {
    NSData *data = [opsJson dataUsingEncoding:NSUTF8StringEncoding];
    NSError *jsonError = nil;
    id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError] : nil;
    if (![parsed isKindOfClass:[NSArray class]]) {
        if (error) *error = jsonError ?: OpenCVMakeError(@"opsJson must be a JSON array");
        return nil;
    }
    return (NSArray *)parsed;
}

/// Strip an optional `data:[mime];base64,` prefix, returning the raw payload.
static NSString *OpenCVStripDataURI(NSString *value) {
    NSRange marker = [value rangeOfString:@"base64,"];
    if (marker.location != NSNotFound) {
        return [value substringFromIndex:marker.location + marker.length];
    }
    return value;
}

Mat OpenCVDecodeImageArg(NSString *value, NSError **error) {
    if (![value isKindOfClass:[NSString class]] || value.length == 0) {
        if (error) *error = OpenCVMakeError(@"image source must be a non-empty string");
        return Mat();
    }
    // Try to read it as a filesystem path first (tolerating a file:// scheme).
    NSString *path = [value hasPrefix:@"file://"] ? [value substringFromIndex:7] : value;
    Mat m = cv::imread(OpenCVPath(path), cv::IMREAD_COLOR);
    if (!m.empty()) {
        return m;
    }
    // Otherwise treat it as a (data-URI or raw) base64 payload.
    NSData *bytes = [[NSData alloc] initWithBase64EncodedString:OpenCVStripDataURI(value)
                                                        options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (bytes.length > 0) {
        std::vector<uchar> buf((const uchar *)bytes.bytes,
                               (const uchar *)bytes.bytes + bytes.length);
        m = cv::imdecode(buf, cv::IMREAD_COLOR);
        if (!m.empty()) {
            return m;
        }
    }
    if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO, @"Could not decode image source");
    return Mat();
}

bool OpenCVResolvePoints(const Mat &current, NSDictionary *params,
                        std::vector<cv::Point> &out) {
    id raw = params[@"points"];
    if ([raw isKindOfClass:[NSArray class]] && [(NSArray *)raw count] > 0) {
        for (id p in (NSArray *)raw) {
            if ([p isKindOfClass:[NSArray class]] && [(NSArray *)p count] >= 2) {
                out.emplace_back([((NSArray *)p)[0] intValue], [((NSArray *)p)[1] intValue]);
            }
        }
        return !out.empty();
    }
    Mat gray = OpenCVEnsureGray(current);
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(gray, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    if (contours.empty()) { return false; }
    auto largest = std::max_element(contours.begin(), contours.end(),
        [](const std::vector<cv::Point> &a, const std::vector<cv::Point> &b) {
            return cv::contourArea(a) < cv::contourArea(b);
        });
    out = *largest;
    return !out.empty();
}

/// Decode the source image described by `input` (a `path` or `base64`
/// descriptor) into a BGR `Mat`. Returns an empty Mat and sets `*error` on
/// failure.
static Mat OpenCVDecodeInput(NSDictionary *input, NSError **error) {
    NSString *kind = input[@"kind"];
    if ([kind isEqualToString:@"path"]) {
        NSString *path = OpenCVOptionalString(input, @"value");
        Mat m = path ? cv::imread(OpenCVPath(path), cv::IMREAD_COLOR) : Mat();
        if (m.empty()) {
            if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not read image at %@", path]);
        }
        return m;
    }
    if ([kind isEqualToString:@"base64"]) {
        NSString *raw = OpenCVOptionalString(input, @"value");
        NSData *bytes = raw
            ? [[NSData alloc] initWithBase64EncodedString:OpenCVStripDataURI(raw)
                                                  options:NSDataBase64DecodingIgnoreUnknownCharacters]
            : nil;
        if (bytes == nil || bytes.length == 0) {
            if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO, @"Could not decode base64 input image");
            return Mat();
        }
        std::vector<uchar> buf((const uchar *)bytes.bytes,
                               (const uchar *)bytes.bytes + bytes.length);
        Mat m = cv::imdecode(buf, cv::IMREAD_COLOR);
        if (m.empty()) {
            if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO, @"Could not decode base64 input image");
        }
        return m;
    }
    if (error) *error = OpenCVMakeError(@"input descriptor has an unknown 'kind'");
    return Mat();
}

/// Encode `mat` to the destination described by `output` (a `path` or `base64`
/// descriptor). Returns the output path or the base64 string, or `nil` on
/// failure.
static NSString *OpenCVEncodeOutput(NSDictionary *output, const Mat &mat, NSError **error) {
    NSString *kind = output[@"kind"];
    if ([kind isEqualToString:@"path"]) {
        NSString *path = OpenCVOptionalString(output, @"value");
        if (path == nil || !cv::imwrite(OpenCVPath(path), mat)) {
            if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not write image to %@", path]);
            return nil;
        }
        return path;
    }
    if ([kind isEqualToString:@"base64"]) {
        NSString *ext = OpenCVOptionalString(output, @"ext") ?: @".png";
        std::vector<uchar> buf;
        if (!cv::imencode(std::string([ext UTF8String]), mat, buf)) {
            if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not encode image as '%@'", ext]);
            return nil;
        }
        NSData *data = [NSData dataWithBytes:buf.data() length:buf.size()];
        return [data base64EncodedStringWithOptions:0];
    }
    if (error) *error = OpenCVMakeError(@"output descriptor has an unknown 'kind'");
    return nil;
}

/// Apply every op in `ops` to `current` in place. Returns `NO` and sets
/// `*error` on the first failing op (bad shape, unknown type, invalid params).
BOOL OpenCVApplyOps(NSArray *ops, Mat &current, NSError **error) {
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
        OpenCVOpHandler handler = [OpenCVOpRegistry handlerForName:type];
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
    return YES;
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

+ (NSMutableDictionary<NSString *, OpenCVDataHandler> *)dataRegistry {
    static NSMutableDictionary<NSString *, OpenCVDataHandler> *registry;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        registry = [NSMutableDictionary dictionary];
    });
    return registry;
}

+ (void)registerDataOp:(NSString *)name handler:(OpenCVDataHandler)handler {
    if (name.length == 0 || handler == nil) return;
    @synchronized ([self dataRegistry]) {
        [self dataRegistry][name] = [handler copy];
    }
}

+ (OpenCVDataHandler)dataHandlerForName:(NSString *)name {
    @synchronized ([self dataRegistry]) {
        return [self dataRegistry][name];
    }
}

+ (BOOL)runPipelineWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                     opsJson:(NSString *)opsJson
                       error:(NSError **)error {
    NSArray *ops = OpenCVParseOps(opsJson, error);
    if (ops == nil) return NO;

    Mat current = cv::imread(OpenCVPath(inputPath), cv::IMREAD_COLOR);
    if (current.empty()) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not read image at %@", inputPath]);
        }
        return NO;
    }

    if (!OpenCVApplyOps(ops, current, error)) return NO;

    if (!cv::imwrite(OpenCVPath(outputPath), current)) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorIO,
                [NSString stringWithFormat:@"Could not write image to %@", outputPath]);
        }
        return NO;
    }
    return YES;
}

+ (NSString *)runPipelineWithInputJson:(NSString *)inputJson
                            outputJson:(NSString *)outputJson
                               opsJson:(NSString *)opsJson
                                 error:(NSError **)error {
    NSArray *ops = OpenCVParseOps(opsJson, error);
    if (ops == nil) return nil;

    NSDictionary *input = OpenCVParseObject(inputJson, error);
    if (input == nil) return nil;
    NSDictionary *output = OpenCVParseObject(outputJson, error);
    if (output == nil) return nil;

    Mat current = OpenCVDecodeInput(input, error);
    if (current.empty()) return nil;

    if (!OpenCVApplyOps(ops, current, error)) return nil;

    return OpenCVEncodeOutput(output, current, error);
}

+ (NSString *)runPipelineDataWithInputJson:(NSString *)inputJson
                                   opsJson:(NSString *)opsJson
                                     error:(NSError **)error {
    NSArray *ops = OpenCVParseOps(opsJson, error);
    if (ops == nil) return nil;
    if (ops.count == 0) {
        if (error) *error = OpenCVMakeError(@"Pipeline has no analysis op");
        return nil;
    }

    id rawDataOp = ops.lastObject;
    if (![rawDataOp isKindOfClass:[NSDictionary class]]) {
        if (error) *error = OpenCVMakeError(@"Analysis op is not an object");
        return nil;
    }
    NSDictionary *dataOp = (NSDictionary *)rawDataOp;
    NSString *type = dataOp[@"type"];
    if (![type isKindOfClass:[NSString class]]) {
        if (error) *error = OpenCVMakeError(@"Analysis op missing 'type'");
        return nil;
    }
    OpenCVDataHandler handler = [self dataHandlerForName:type];
    if (handler == nil) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorUnknownOp,
                [NSString stringWithFormat:@"Unknown analysis op type '%@'", type]);
        }
        return nil;
    }

    NSDictionary *input = OpenCVParseObject(inputJson, error);
    if (input == nil) return nil;

    Mat current = OpenCVDecodeInput(input, error);
    if (current.empty()) return nil;

    NSArray *transforms = [ops subarrayWithRange:NSMakeRange(0, ops.count - 1)];
    if (!OpenCVApplyOps(transforms, current, error)) return nil;

    NSError *opError = nil;
    NSDictionary *result = handler(current, dataOp, &opError);
    if (result == nil) {
        if (error) *error = opError ?: OpenCVMakeError(@"Analysis op produced no result");
        return nil;
    }

    NSError *jsonError = nil;
    NSData *data = [NSJSONSerialization dataWithJSONObject:result options:0 error:&jsonError];
    if (data == nil) {
        if (error) *error = jsonError ?: OpenCVMakeError(@"Could not encode analysis result");
        return nil;
    }
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
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
