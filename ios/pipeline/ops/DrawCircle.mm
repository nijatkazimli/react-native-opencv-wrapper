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
    int thickness = [params[@"thickness"] intValue];
    if (thickness < 1) {
        if (error) *error = OpenCVMakeError(@"drawCircle 'thickness' must be >= 1");
        return Mat();
    }
    int centerX = [params[@"centerX"] intValue];
    int centerY = [params[@"centerY"] intValue];
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 255));
    int lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;
    Mat dst = current.clone();
    cv::Point center(centerX, centerY);
    if ([params[@"fillColor"] isKindOfClass:[NSArray class]]) {
        cv::Scalar fillColor = OpenCVColorScalar(params[@"fillColor"], color);
        cv::circle(dst, center, radius, fillColor, cv::FILLED, lineType);
    }
    cv::circle(dst, center, radius, color, thickness, lineType);
    return dst;
});
