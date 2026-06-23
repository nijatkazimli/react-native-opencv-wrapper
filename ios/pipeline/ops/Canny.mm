#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(canny, @"canny",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    double t1 = [params[@"threshold1"] doubleValue];
    double t2 = [params[@"threshold2"] doubleValue];
    Mat dst;
    cv::Canny(OpenCVEnsureGray(current), dst, t1, t2);
    return dst;
});
