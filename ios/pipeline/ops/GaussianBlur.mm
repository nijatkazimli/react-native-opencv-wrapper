#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(gaussianBlur, @"gaussianBlur",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int k = [params[@"kernelSize"] intValue];
    double sigmaX = [params[@"sigmaX"] doubleValue];
    if (!OpenCVOddPositive(k)) {
        if (error) *error = OpenCVMakeError(@"kernelSize must be a positive odd integer");
        return Mat();
    }
    Mat dst;
    cv::GaussianBlur(current, dst, cv::Size(k, k), sigmaX);
    return dst;
});
