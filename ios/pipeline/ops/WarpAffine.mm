#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Parse `params[key]` into exactly `count` floating-point [x, y] points.
// Rejects malformed input via `*error`.
static bool AffineParsePoints(NSDictionary *params, NSString *key, int count,
                              std::vector<cv::Point2f> &out, NSError **error) {
    id raw = params[key];
    if (![raw isKindOfClass:[NSArray class]] || (int)[(NSArray *)raw count] != count) {
        if (error) *error = OpenCVMakeError([NSString
            stringWithFormat:@"'%@' must be an array of %d [x, y] points", key, count]);
        return false;
    }
    for (id point in (NSArray *)raw) {
        if (![point isKindOfClass:[NSArray class]] || [(NSArray *)point count] < 2) {
            if (error) *error = OpenCVMakeError([NSString
                stringWithFormat:@"'%@' points must be [x, y] number pairs", key]);
            return false;
        }
        id px = ((NSArray *)point)[0];
        id py = ((NSArray *)point)[1];
        if (![px isKindOfClass:[NSNumber class]] || ![py isKindOfClass:[NSNumber class]]) {
            if (error) *error = OpenCVMakeError([NSString
                stringWithFormat:@"'%@' points must be [x, y] number pairs", key]);
            return false;
        }
        out.emplace_back([px floatValue], [py floatValue]);
    }
    return true;
}

// Map three source points onto three destination points (affine warp), which
// covers rotation, scaling, shear and translation. `width`/`height` default to
// the current image size.
OPENCV_REGISTER_OP(warpAffine, @"warpAffine",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point2f> src, dst;
    if (!AffineParsePoints(params, @"srcPoints", 3, src, error)) return Mat();
    if (!AffineParsePoints(params, @"dstPoints", 3, dst, error)) return Mat();
    int width = params[@"width"] ? [params[@"width"] intValue] : current.cols;
    int height = params[@"height"] ? [params[@"height"] intValue] : current.rows;
    if (width <= 0 || height <= 0) {
        if (error) *error = OpenCVMakeError(@"warpAffine width and height must be positive");
        return Mat();
    }
    Mat transform = cv::getAffineTransform(src, dst);
    Mat out;
    cv::warpAffine(current, out, transform, cv::Size(width, height));
    return out;
});
