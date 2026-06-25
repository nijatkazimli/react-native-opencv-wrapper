#import "../OpenCVOpRegistry.h"

#import <algorithm>

using cv::Mat;

// Map the JS `operation` string to an OpenCV morphology flag.
static int MorphOperationFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if ([name isEqualToString:@"open"]) return cv::MORPH_OPEN;
    if ([name isEqualToString:@"close"]) return cv::MORPH_CLOSE;
    if ([name isEqualToString:@"gradient"]) return cv::MORPH_GRADIENT;
    if ([name isEqualToString:@"tophat"]) return cv::MORPH_TOPHAT;
    if ([name isEqualToString:@"blackhat"]) return cv::MORPH_BLACKHAT;
    *ok = NO;
    return cv::MORPH_OPEN;
}

OPENCV_REGISTER_OP(morphologyEx, @"morphologyEx",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"kernelSize", @"iterations"], error)) return Mat();
    int k = [params[@"kernelSize"] intValue];
    if (!OpenCVOddPositive(k)) {
        if (error) *error = OpenCVMakeError(@"morphologyEx 'kernelSize' must be a positive odd integer");
        return Mat();
    }
    BOOL ok = YES;
    int operation = MorphOperationFlag(OpenCVOptionalString(params, @"operation"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"morphologyEx 'operation' is not supported");
        return Mat();
    }
    int iterations = [params[@"iterations"] intValue];
    Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(k, k));
    Mat dst;
    cv::morphologyEx(current, dst, operation, kernel, cv::Point(-1, -1),
                     std::max(1, iterations));
    return dst;
});
