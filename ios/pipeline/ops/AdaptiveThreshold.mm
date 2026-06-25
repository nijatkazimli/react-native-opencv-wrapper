#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Map the JS `method` string to an OpenCV adaptive-method flag.
static int AdaptiveMethodFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if ([name isEqualToString:@"mean"]) return cv::ADAPTIVE_THRESH_MEAN_C;
    if ([name isEqualToString:@"gaussian"]) return cv::ADAPTIVE_THRESH_GAUSSIAN_C;
    *ok = NO;
    return cv::ADAPTIVE_THRESH_GAUSSIAN_C;
}

// Map the JS `thresholdType` string to an OpenCV threshold-type flag.
static int AdaptiveThresholdTypeFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if ([name isEqualToString:@"binary"]) return cv::THRESH_BINARY;
    if ([name isEqualToString:@"binaryInv"]) return cv::THRESH_BINARY_INV;
    *ok = NO;
    return cv::THRESH_BINARY;
}

OPENCV_REGISTER_OP(adaptiveThreshold, @"adaptiveThreshold",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"maxValue", @"blockSize", @"c"], error)) return Mat();
    int blockSize = [params[@"blockSize"] intValue];
    if (!OpenCVOddPositive(blockSize) || blockSize < 3) {
        if (error) *error = OpenCVMakeError(@"adaptiveThreshold 'blockSize' must be an odd integer >= 3");
        return Mat();
    }
    BOOL ok = YES;
    int method = AdaptiveMethodFlag(OpenCVOptionalString(params, @"method"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"adaptiveThreshold 'method' must be 'mean' or 'gaussian'");
        return Mat();
    }
    int thresholdType = AdaptiveThresholdTypeFlag(OpenCVOptionalString(params, @"thresholdType"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"adaptiveThreshold 'thresholdType' must be 'binary' or 'binaryInv'");
        return Mat();
    }
    Mat gray = OpenCVEnsureGray(current);
    Mat dst;
    cv::adaptiveThreshold(gray, dst, [params[@"maxValue"] doubleValue], method,
                          thresholdType, blockSize, [params[@"c"] doubleValue]);
    return dst;
});
