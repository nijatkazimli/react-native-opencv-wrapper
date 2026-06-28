#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Draw a straight line segment onto a copy of the current image.
OPENCV_REGISTER_OP(drawLine, @"drawLine",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"x1", @"y1", @"x2", @"y2", @"thickness"], error)) return Mat();
    OpenCVDrawStyle style;
    if (!OpenCVResolveDrawStyle(params, @"drawLine", &style, error)) return Mat();
    int x1 = [params[@"x1"] intValue];
    int y1 = [params[@"y1"] intValue];
    int x2 = [params[@"x2"] intValue];
    int y2 = [params[@"y2"] intValue];
    Mat dst = current.clone();
    cv::line(dst, cv::Point(x1, y1), cv::Point(x2, y2), style.color, style.thickness, style.lineType);
    return dst;
});
