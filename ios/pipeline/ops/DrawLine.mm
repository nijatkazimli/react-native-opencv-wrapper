#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Draw a straight line segment onto a copy of the current image.
OPENCV_REGISTER_OP(drawLine, @"drawLine",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"x1", @"y1", @"x2", @"y2", @"thickness"], error)) return Mat();
    int thickness = [params[@"thickness"] intValue];
    if (thickness < 1) {
        if (error) *error = OpenCVMakeError(@"drawLine 'thickness' must be >= 1");
        return Mat();
    }
    int x1 = [params[@"x1"] intValue];
    int y1 = [params[@"y1"] intValue];
    int x2 = [params[@"x2"] intValue];
    int y2 = [params[@"y2"] intValue];
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 255));
    int lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;
    Mat dst = current.clone();
    cv::line(dst, cv::Point(x1, y1), cv::Point(x2, y2), color, thickness, lineType);
    return dst;
});
