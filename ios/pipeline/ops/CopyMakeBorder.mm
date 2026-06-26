#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Resolve the border-type name to an OpenCV flag. Absent/empty uses the
// "constant" default; an unrecognized value is rejected via `*ok = NO`.
static int BorderFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if (name.length == 0 || [name isEqualToString:@"constant"]) return cv::BORDER_CONSTANT;
    if ([name isEqualToString:@"replicate"]) return cv::BORDER_REPLICATE;
    if ([name isEqualToString:@"reflect"]) return cv::BORDER_REFLECT;
    if ([name isEqualToString:@"reflect101"]) return cv::BORDER_REFLECT_101;
    if ([name isEqualToString:@"wrap"]) return cv::BORDER_WRAP;
    *ok = NO;
    return cv::BORDER_CONSTANT;
}

// Pad an image with the given top/bottom/left/right margins. `borderType`
// selects how the border pixels are produced; `color` applies only to the
// "constant" border type.
OPENCV_REGISTER_OP(copyMakeBorder, @"copyMakeBorder",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"top", @"bottom", @"left", @"right"], error)) return Mat();
    int top = [params[@"top"] intValue];
    int bottom = [params[@"bottom"] intValue];
    int left = [params[@"left"] intValue];
    int right = [params[@"right"] intValue];
    if (top < 0 || bottom < 0 || left < 0 || right < 0) {
        if (error) *error = OpenCVMakeError(@"copyMakeBorder margins must be >= 0");
        return Mat();
    }
    BOOL ok = YES;
    int flag = BorderFlag(OpenCVOptionalString(params, @"borderType"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"borderType must be constant, replicate, reflect, reflect101 or wrap");
        return Mat();
    }
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 0, 0));
    Mat out;
    cv::copyMakeBorder(current, out, top, bottom, left, right, flag, color);
    return out;
});
