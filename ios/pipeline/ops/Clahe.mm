#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Contrast-limited adaptive histogram equalization. The image is grayscaled
// first, so the result is single-channel. `tileGridSize` is the side length of
// the square grid of tiles equalized independently.
OPENCV_REGISTER_OP(clahe, @"clahe",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    double clipLimit = params[@"clipLimit"] ? [params[@"clipLimit"] doubleValue] : 2.0;
    int tile = params[@"tileGridSize"] ? [params[@"tileGridSize"] intValue] : 8;
    if (clipLimit <= 0 || tile < 1) {
        if (error) *error = OpenCVMakeError(@"clahe clipLimit must be > 0 and tileGridSize >= 1");
        return Mat();
    }
    Mat gray = OpenCVEnsureGray(current);
    cv::Ptr<cv::CLAHE> clahe = cv::createCLAHE(clipLimit, cv::Size(tile, tile));
    Mat out;
    clahe->apply(gray, out);
    return out;
});
