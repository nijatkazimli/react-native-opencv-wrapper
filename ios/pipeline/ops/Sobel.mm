#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Sobel derivative (`cv::Sobel`). Computed at signed 16-bit precision then
// converted to an absolute 8-bit image so the result stays displayable.
OPENCV_REGISTER_OP(sobel, @"sobel",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    if (!OpenCVRequireNumbers(params, @[@"dx", @"dy"], error)) return Mat();
    int dx = [params[@"dx"] intValue];
    int dy = [params[@"dy"] intValue];
    int ksize = params[@"ksize"] ? [params[@"ksize"] intValue] : 3;
    double scale = params[@"scale"] ? [params[@"scale"] doubleValue] : 1.0;
    double delta = params[@"delta"] ? [params[@"delta"] doubleValue] : 0.0;
    if (dx < 0 || dy < 0 || dx + dy < 1) {
        if (error) *error = OpenCVMakeError(@"sobel dx and dy must be >= 0 with dx + dy >= 1");
        return Mat();
    }
    if (ksize < 1 || ksize % 2 == 0 || ksize > 7) {
        if (error) *error = OpenCVMakeError(@"sobel ksize must be 1, 3, 5 or 7");
        return Mat();
    }
    Mat signedGradient;
    cv::Sobel(current, signedGradient, CV_16S, dx, dy, ksize, scale, delta);
    Mat out;
    cv::convertScaleAbs(signedGradient, out);
    return out;
});
