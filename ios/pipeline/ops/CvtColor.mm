#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Resolve a `<from>2<to>` conversion name to an OpenCV color-conversion flag.
// An unrecognized value is rejected via `*ok = NO`.
static int CvtColorCode(NSString *name, BOOL *ok) {
    *ok = YES;
    if ([name isEqualToString:@"BGR2GRAY"]) return cv::COLOR_BGR2GRAY;
    if ([name isEqualToString:@"GRAY2BGR"]) return cv::COLOR_GRAY2BGR;
    if ([name isEqualToString:@"BGR2RGB"]) return cv::COLOR_BGR2RGB;
    if ([name isEqualToString:@"RGB2BGR"]) return cv::COLOR_RGB2BGR;
    if ([name isEqualToString:@"BGR2HSV"]) return cv::COLOR_BGR2HSV;
    if ([name isEqualToString:@"HSV2BGR"]) return cv::COLOR_HSV2BGR;
    if ([name isEqualToString:@"BGR2HLS"]) return cv::COLOR_BGR2HLS;
    if ([name isEqualToString:@"HLS2BGR"]) return cv::COLOR_HLS2BGR;
    if ([name isEqualToString:@"BGR2Lab"]) return cv::COLOR_BGR2Lab;
    if ([name isEqualToString:@"Lab2BGR"]) return cv::COLOR_Lab2BGR;
    if ([name isEqualToString:@"BGR2YCrCb"]) return cv::COLOR_BGR2YCrCb;
    if ([name isEqualToString:@"YCrCb2BGR"]) return cv::COLOR_YCrCb2BGR;
    *ok = NO;
    return cv::COLOR_BGR2GRAY;
}

OPENCV_REGISTER_OP(cvtColor, @"cvtColor",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    BOOL ok = YES;
    int flag = CvtColorCode(OpenCVOptionalString(params, @"code"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"cvtColor 'code' is not a supported conversion");
        return Mat();
    }
    Mat dst;
    cv::cvtColor(current, dst, flag);
    return dst;
});
