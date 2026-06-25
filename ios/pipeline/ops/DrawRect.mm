#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Draw a rectangle outline onto a copy of the current image.
OPENCV_REGISTER_OP(drawRect, @"drawRect",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"x", @"y", @"width", @"height", @"thickness"], error)) return Mat();
    int width = [params[@"width"] intValue];
    int height = [params[@"height"] intValue];
    if (width <= 0 || height <= 0) {
        if (error) *error = OpenCVMakeError(@"drawRect 'width' and 'height' must be positive");
        return Mat();
    }
    int thickness = [params[@"thickness"] intValue];
    if (thickness < 1) {
        if (error) *error = OpenCVMakeError(@"drawRect 'thickness' must be >= 1");
        return Mat();
    }
    int x = [params[@"x"] intValue];
    int y = [params[@"y"] intValue];
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 255));
    int lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;
    Mat dst = current.clone();
    cv::Rect rect(x, y, width, height);
    if ([params[@"fillColor"] isKindOfClass:[NSArray class]]) {
        cv::Scalar fillColor = OpenCVColorScalar(params[@"fillColor"], color);
        cv::rectangle(dst, rect, fillColor, cv::FILLED, lineType);
    }
    cv::rectangle(dst, rect, color, thickness, lineType);
    return dst;
});
