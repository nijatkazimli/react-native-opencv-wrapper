#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Scharr derivative (`cv::Scharr`) — a more accurate 3×3 first-order operator.
// Exactly one of dx/dy must be 1. Returned as an absolute 8-bit image.
OPENCV_REGISTER_OP(scharr, @"scharr",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"dx", @"dy"], error)) return Mat();
    int dx = [params[@"dx"] intValue];
    int dy = [params[@"dy"] intValue];
    double scale = params[@"scale"] ? [params[@"scale"] doubleValue] : 1.0;
    double delta = params[@"delta"] ? [params[@"delta"] doubleValue] : 0.0;
    if (dx < 0 || dy < 0 || dx + dy != 1) {
        if (error) *error = OpenCVMakeError(@"scharr requires exactly one of dx/dy to be 1 and the other 0");
        return Mat();
    }
    Mat signedGradient;
    cv::Scharr(current, signedGradient, CV_16S, dx, dy, scale, delta);
    Mat out;
    cv::convertScaleAbs(signedGradient, out);
    return out;
});
