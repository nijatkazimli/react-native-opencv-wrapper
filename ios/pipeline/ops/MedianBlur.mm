#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(medianBlur, @"medianBlur",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int k = [params[@"kernelSize"] intValue];
    if (!OpenCVOddPositive(k)) {
        if (error) *error = OpenCVMakeError(@"kernelSize must be a positive odd integer");
        return Mat();
    }
    Mat dst;
    cv::medianBlur(current, dst, k);
    return dst;
});
