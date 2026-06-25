#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(bitwiseNot, @"bitwiseNot",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat dst;
    cv::bitwise_not(current, dst);
    return dst;
});
