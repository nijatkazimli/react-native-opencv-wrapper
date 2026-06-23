#import "../OpenCVOpRegistry.h"

#import <algorithm>

using cv::Mat;

OPENCV_REGISTER_OP(dilate, @"dilate",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"kernelSize"], error)) return Mat();
    int k = [params[@"kernelSize"] intValue];
    int iterations = [params[@"iterations"] intValue];
    if (!OpenCVOddPositive(k)) {
        if (error) *error = OpenCVMakeError(@"kernelSize must be a positive odd integer");
        return Mat();
    }
    Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(k, k));
    Mat dst;
    cv::dilate(current, dst, kernel, cv::Point(-1, -1), std::max(1, iterations));
    return dst;
});
