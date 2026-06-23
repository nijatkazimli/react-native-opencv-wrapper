#import "../OpenCVOpRegistry.h"

using cv::Mat;

OPENCV_REGISTER_OP(gray, @"gray",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    return OpenCVEnsureGray(current);
});
