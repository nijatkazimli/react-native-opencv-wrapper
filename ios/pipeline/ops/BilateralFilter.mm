#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Edge-preserving smoothing. `diameter` is the pixel neighbourhood diameter;
// `sigmaColor`/`sigmaSpace` control how much colour and distance differences are
// mixed. Writes to a separate destination (in-place is not supported).
OPENCV_REGISTER_OP(bilateralFilter, @"bilateralFilter",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int diameter = params[@"diameter"] ? [params[@"diameter"] intValue] : 9;
    double sigmaColor = params[@"sigmaColor"] ? [params[@"sigmaColor"] doubleValue] : 75.0;
    double sigmaSpace = params[@"sigmaSpace"] ? [params[@"sigmaSpace"] doubleValue] : 75.0;
    if (diameter < 1) {
        if (error) *error = OpenCVMakeError(@"bilateralFilter diameter must be >= 1");
        return Mat();
    }
    Mat out;
    cv::bilateralFilter(current, out, diameter, sigmaColor, sigmaSpace);
    return out;
});
