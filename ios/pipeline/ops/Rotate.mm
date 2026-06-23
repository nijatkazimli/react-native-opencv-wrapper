#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(rotate, @"rotate",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"angle"], error)) return Mat();
    int angle = [params[@"angle"] intValue];
    int code;
    switch (angle) {
        case 90: code = cv::ROTATE_90_CLOCKWISE; break;
        case 180: code = cv::ROTATE_180; break;
        case 270: code = cv::ROTATE_90_COUNTERCLOCKWISE; break;
        default:
            if (error) *error = OpenCVMakeError(@"rotate angle must be 90, 180 or 270");
            return Mat();
    }
    Mat dst;
    cv::rotate(current, dst, code);
    return dst;
});
