#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Global histogram equalization. The image is grayscaled first, so the result
// is single-channel.
OPENCV_REGISTER_OP(equalizeHist, @"equalizeHist",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat gray = OpenCVEnsureGray(current);
    Mat out;
    cv::equalizeHist(gray, out);
    return out;
});
