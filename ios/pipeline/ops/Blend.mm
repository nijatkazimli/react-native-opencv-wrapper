#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Linearly blend the current image with a second image:
//   out = alpha * current + beta * source + gamma
// `source` is a filesystem path or a (data-URI/raw) base64 string; it is
// decoded and resized to match the current image before blending.
OPENCV_REGISTER_OP(blend, @"blend",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *source = OpenCVOptionalString(params, @"source");
    if (source == nil) {
        if (error) *error = OpenCVMakeError(@"blend 'source' must be a string path or base64 image");
        return Mat();
    }
    Mat other = OpenCVDecodeImageArg(source, error);
    if (other.empty()) return Mat();

    double alpha = params[@"alpha"] ? [params[@"alpha"] doubleValue] : 0.5;
    double beta = params[@"beta"] ? [params[@"beta"] doubleValue] : 0.5;
    double gamma = params[@"gamma"] ? [params[@"gamma"] doubleValue] : 0.0;

    if (other.size() != current.size()) {
        cv::resize(other, other, current.size());
    }
    if (other.channels() != current.channels()) {
        if (current.channels() == 1) {
            cv::cvtColor(other, other, cv::COLOR_BGR2GRAY);
        } else {
            cv::cvtColor(other, other, cv::COLOR_GRAY2BGR);
        }
    }

    Mat out;
    cv::addWeighted(current, alpha, other, beta, gamma, out);
    return out;
});
