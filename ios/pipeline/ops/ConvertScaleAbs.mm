#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Brightness/contrast adjustment: out = saturate_cast<uint8>(|alpha * current + beta|).
// The result is always an 8-bit image.
OPENCV_REGISTER_OP(convertScaleAbs, @"convertScaleAbs",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    double alpha = params[@"alpha"] ? [params[@"alpha"] doubleValue] : 1.0;
    double beta = params[@"beta"] ? [params[@"beta"] doubleValue] : 0.0;
    Mat out;
    cv::convertScaleAbs(current, out, alpha, beta);
    return out;
});
