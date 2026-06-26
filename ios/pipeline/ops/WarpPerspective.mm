#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Parse `params[key]` into exactly `count` floating-point [x, y] points.
// Rejects malformed input via `*error`.
static bool WarpParsePoints(NSDictionary *params, NSString *key, int count,
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

// Map four source points onto four destination points (perspective warp), e.g.
// to deskew a document detected via `detectDocument`. `width`/`height` default
// to the current image size.
OPENCV_REGISTER_OP(warpPerspective, @"warpPerspective",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point2f> src, dst;
    if (!WarpParsePoints(params, @"srcPoints", 4, src, error)) return Mat();
    if (!WarpParsePoints(params, @"dstPoints", 4, dst, error)) return Mat();
    int width = params[@"width"] ? [params[@"width"] intValue] : current.cols;
    int height = params[@"height"] ? [params[@"height"] intValue] : current.rows;
    if (width <= 0 || height <= 0) {
        if (error) *error = OpenCVMakeError(@"warpPerspective width and height must be positive");
        return Mat();
    }
    Mat transform = cv::getPerspectiveTransform(src, dst);
    Mat out;
    cv::warpPerspective(current, out, transform, cv::Size(width, height));
    return out;
});
