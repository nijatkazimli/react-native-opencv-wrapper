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
    OpenCVDrawStyle style;
    if (!OpenCVResolveDrawStyle(params, @"drawRect", &style, error)) return Mat();
    int x = [params[@"x"] intValue];
    int y = [params[@"y"] intValue];
    Mat dst = current.clone();
    cv::Rect rect(x, y, width, height);
    if (style.hasFill) {
        cv::rectangle(dst, rect, style.fillColor, cv::FILLED, style.lineType);
    }
    cv::rectangle(dst, rect, style.color, style.thickness, style.lineType);
    return dst;
});
