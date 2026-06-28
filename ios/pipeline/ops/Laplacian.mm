#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Laplacian (`cv::Laplacian`) — isotropic second-derivative edge detector.
// Computed at signed precision then returned as an absolute 8-bit image.
OPENCV_REGISTER_OP(laplacian, @"laplacian",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int ksize = params[@"ksize"] ? [params[@"ksize"] intValue] : 1;
    double scale = params[@"scale"] ? [params[@"scale"] doubleValue] : 1.0;
    double delta = params[@"delta"] ? [params[@"delta"] doubleValue] : 0.0;
    if (ksize < 1 || ksize % 2 == 0 || ksize > 7) {
        if (error) *error = OpenCVMakeError(@"laplacian ksize must be 1, 3, 5 or 7");
        return Mat();
    }
    Mat signedResponse;
    cv::Laplacian(current, signedResponse, CV_16S, ksize, scale, delta);
    Mat out;
    cv::convertScaleAbs(signedResponse, out);
    return out;
});
