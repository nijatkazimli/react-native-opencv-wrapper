#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Resolve the interpolation name to an OpenCV flag. Absent/empty uses the
// "linear" default; an unrecognized value is rejected via `*ok = NO`.
static int InterpolationFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if (name.length == 0 || [name isEqualToString:@"linear"]) return cv::INTER_LINEAR;
    if ([name isEqualToString:@"nearest"]) return cv::INTER_NEAREST;
    if ([name isEqualToString:@"cubic"]) return cv::INTER_CUBIC;
    if ([name isEqualToString:@"area"]) return cv::INTER_AREA;
    *ok = NO;
    return cv::INTER_LINEAR;
}

OPENCV_REGISTER_OP(resize, @"resize",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"width", @"height"], error)) return Mat();
    int w = [params[@"width"] intValue];
    int h = [params[@"height"] intValue];
    if (w < 1 || h < 1) {
        if (error) *error = OpenCVMakeError(@"resize width/height must be positive");
        return Mat();
    }
    BOOL ok = YES;
    int interpolation = InterpolationFlag(OpenCVOptionalString(params, @"interpolation"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"interpolation must be linear, nearest, cubic or area");
        return Mat();
    }
    Mat dst;
    cv::resize(current, dst, cv::Size(w, h), 0, 0, interpolation);
    return dst;
});
