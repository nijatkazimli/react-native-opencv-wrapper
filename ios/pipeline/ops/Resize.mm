#import "../OpenCVOpRegistry.h"

using cv::Mat;

static int InterpolationFlag(NSString *name) {
    if ([name isEqualToString:@"nearest"]) return cv::INTER_NEAREST;
    if ([name isEqualToString:@"cubic"]) return cv::INTER_CUBIC;
    if ([name isEqualToString:@"area"]) return cv::INTER_AREA;
    return cv::INTER_LINEAR; // default / "linear"
}

OPENCV_REGISTER_OP(resize, @"resize",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int w = [params[@"width"] intValue];
    int h = [params[@"height"] intValue];
    if (w < 1 || h < 1) {
        if (error) *error = OpenCVMakeError(@"resize width/height must be positive");
        return Mat();
    }
    Mat dst;
    cv::resize(current, dst, cv::Size(w, h), 0, 0, InterpolationFlag(params[@"interpolation"]));
    return dst;
});
