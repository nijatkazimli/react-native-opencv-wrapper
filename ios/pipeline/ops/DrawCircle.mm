#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Draw a circle outline onto a copy of the current image.
OPENCV_REGISTER_OP(drawCircle, @"drawCircle",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"centerX", @"centerY", @"radius", @"thickness"], error)) return Mat();
    int radius = [params[@"radius"] intValue];
    if (radius <= 0) {
        if (error) *error = OpenCVMakeError(@"drawCircle 'radius' must be positive");
        return Mat();
    }
    OpenCVDrawStyle style;
    if (!OpenCVResolveDrawStyle(params, @"drawCircle", &style, error)) return Mat();
    int centerX = [params[@"centerX"] intValue];
    int centerY = [params[@"centerY"] intValue];
    Mat dst = current.clone();
    cv::Point center(centerX, centerY);
    if (style.hasFill) {
        cv::circle(dst, center, radius, style.fillColor, cv::FILLED, style.lineType);
    }
    cv::circle(dst, center, radius, style.color, style.thickness, style.lineType);
    return dst;
});
