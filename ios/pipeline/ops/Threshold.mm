#import "../OpenCVOpRegistry.h"

using cv::Mat;

static int ThresholdFlag(NSString *name) {
    if ([name isEqualToString:@"binaryInv"]) return cv::THRESH_BINARY_INV;
    if ([name isEqualToString:@"trunc"]) return cv::THRESH_TRUNC;
    if ([name isEqualToString:@"toZero"]) return cv::THRESH_TOZERO;
    if ([name isEqualToString:@"toZeroInv"]) return cv::THRESH_TOZERO_INV;
    return cv::THRESH_BINARY; // default / "binary"
}

OPENCV_REGISTER_OP(threshold, @"threshold",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    double thresh = [params[@"thresh"] doubleValue];
    double maxValue = [params[@"maxValue"] doubleValue];
    Mat dst;
    cv::threshold(current, dst, thresh, maxValue, ThresholdFlag(params[@"thresholdType"]));
    return dst;
});
