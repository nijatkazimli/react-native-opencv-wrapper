#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Resolve the norm-type name to an OpenCV flag. Absent/empty uses the "minmax"
// default; an unrecognized value is rejected via `*ok = NO`.
static int NormFlag(NSString *name, BOOL *ok) {
    *ok = YES;
    if (name.length == 0 || [name isEqualToString:@"minmax"]) return cv::NORM_MINMAX;
    if ([name isEqualToString:@"l1"]) return cv::NORM_L1;
    if ([name isEqualToString:@"l2"]) return cv::NORM_L2;
    if ([name isEqualToString:@"inf"]) return cv::NORM_INF;
    *ok = NO;
    return cv::NORM_MINMAX;
}

// Rescale pixel intensities. For "minmax" the values are stretched into the
// [alpha, beta] range; for "l1"/"l2"/"inf" the chosen norm of the array is
// scaled to `alpha` (and `beta` is ignored).
OPENCV_REGISTER_OP(normalize, @"normalize",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    double alpha = params[@"alpha"] ? [params[@"alpha"] doubleValue] : 0.0;
    double beta = params[@"beta"] ? [params[@"beta"] doubleValue] : 255.0;
    BOOL ok = YES;
    int flag = NormFlag(OpenCVOptionalString(params, @"normType"), &ok);
    if (!ok) {
        if (error) *error = OpenCVMakeError(@"normType must be minmax, l1, l2 or inf");
        return Mat();
    }
    // NORM_MINMAX is undefined for multi-channel arrays, so stretch each channel
    // independently.
    if (flag == cv::NORM_MINMAX && current.channels() > 1) {
        std::vector<Mat> channels;
        cv::split(current, channels);
        for (Mat &channel : channels) {
            cv::normalize(channel, channel, alpha, beta, flag);
        }
        Mat out;
        cv::merge(channels, out);
        return out;
    }
    Mat out;
    cv::normalize(current, out, alpha, beta, flag);
    return out;
});
