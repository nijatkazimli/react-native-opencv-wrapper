#import "../OpenCVOpRegistry.h"

#import <string>

using cv::Mat;

// Draw a text label onto a copy of the current image (Hershey simplex font).
OPENCV_REGISTER_OP(putText, @"putText",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"x", @"y", @"fontScale", @"thickness"], error)) return Mat();
    NSString *text = OpenCVOptionalString(params, @"text");
    if (text.length == 0) {
        if (error) *error = OpenCVMakeError(@"putText 'text' must be a non-empty string");
        return Mat();
    }
    double fontScale = [params[@"fontScale"] doubleValue];
    if (fontScale <= 0) {
        if (error) *error = OpenCVMakeError(@"putText 'fontScale' must be positive");
        return Mat();
    }
    int thickness = [params[@"thickness"] intValue];
    if (thickness < 1) {
        if (error) *error = OpenCVMakeError(@"putText 'thickness' must be >= 1");
        return Mat();
    }
    int x = [params[@"x"] intValue];
    int y = [params[@"y"] intValue];
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 255));
    int lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;
    Mat dst = current.clone();
    cv::putText(dst, std::string([text UTF8String]), cv::Point(x, y),
                cv::FONT_HERSHEY_SIMPLEX, fontScale, color, thickness, lineType);
    return dst;
});
