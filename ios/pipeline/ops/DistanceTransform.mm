#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Distance transform of a binarized (Otsu) grayscale image; each foreground
// pixel becomes its distance to the nearest zero pixel.
OPENCV_REGISTER_OP(distanceTransform, @"distanceTransform",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *dt = OpenCVOptionalString(params, @"distanceType");
    int distType = cv::DIST_L2;
    if ([dt isEqualToString:@"L1"]) { distType = cv::DIST_L1; }
    else if ([dt isEqualToString:@"C"]) { distType = cv::DIST_C; }

    int maskSize = params[@"maskSize"] ? [params[@"maskSize"] intValue] : 3;
    if (maskSize != 0 && maskSize != 3 && maskSize != 5) { maskSize = 3; }
    BOOL normalize = params[@"normalize"] ? [params[@"normalize"] boolValue] : YES;

    Mat gray = OpenCVEnsureGray(current);
    Mat bin;
    cv::threshold(gray, bin, 0, 255, cv::THRESH_BINARY | cv::THRESH_OTSU);

    Mat dist;
    cv::distanceTransform(bin, dist, distType, maskSize);
    if (normalize) {
        cv::normalize(dist, dist, 0, 255, cv::NORM_MINMAX);
    }
    Mat out;
    dist.convertTo(out, CV_8U);
    return out;
});
