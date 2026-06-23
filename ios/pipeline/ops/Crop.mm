#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(crop, @"crop",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int x = [params[@"x"] intValue];
    int y = [params[@"y"] intValue];
    int w = [params[@"width"] intValue];
    int h = [params[@"height"] intValue];
    if (x < 0 || y < 0 || w < 1 || h < 1 ||
        x + w > current.cols || y + h > current.rows) {
        if (error) *error = OpenCVMakeError(@"crop rectangle is out of image bounds");
        return Mat();
    }
    // clone() so the result owns its data independent of `current`.
    return current(cv::Rect(x, y, w, h)).clone();
});
