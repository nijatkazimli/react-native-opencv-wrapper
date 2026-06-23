#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(flip, @"flip",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *dir = params[@"direction"];
    int code;
    if ([dir isEqualToString:@"horizontal"]) code = 1;
    else if ([dir isEqualToString:@"vertical"]) code = 0;
    else if ([dir isEqualToString:@"both"]) code = -1;
    else {
        if (error) *error = OpenCVMakeError(@"flip direction must be horizontal, vertical or both");
        return Mat();
    }
    Mat dst;
    cv::flip(current, dst, code);
    return dst;
});
