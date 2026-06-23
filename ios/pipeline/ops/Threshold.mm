#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Resolve the threshold-type name to an OpenCV flag. Absent/empty uses the
// "binary" default; an unrecognized value is rejected via `*ok = NO`.
static int ThresholdFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if (name.length == 0 || [name isEqualToString:@"binary"]) return cv::THRESH_BINARY;
    if ([name isEqualToString:@"binaryInv"]) return cv::THRESH_BINARY_INV;
    if ([name isEqualToString:@"trunc"]) return cv::THRESH_TRUNC;
    if ([name isEqualToString:@"toZero"]) return cv::THRESH_TOZERO;
    if ([name isEqualToString:@"toZeroInv"]) return cv::THRESH_TOZERO_INV;
    *ok = NO;
    return cv::THRESH_BINARY;
}

OPENCV_REGISTER_OP(threshold, @"threshold",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"thresh", @"maxValue"], error)) return Mat();
    double thresh = [params[@"thresh"] doubleValue];
    double maxValue = [params[@"maxValue"] doubleValue];
    BOOL ok = YES;
    int flag = ThresholdFlag(OpenCVOptionalString(params, @"thresholdType"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"thresholdType must be binary, binaryInv, trunc, toZero or toZeroInv");
        return Mat();
    }
    Mat dst;
    cv::threshold(current, dst, thresh, maxValue, flag);
    return dst;
});
