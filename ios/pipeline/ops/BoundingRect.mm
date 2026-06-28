#import "../OpenCVOpRegistry.h"

#import <algorithm>
#import <vector>

using cv::Mat;

// Resolve the points to analyse: explicit `params[@"points"]` if present,
// otherwise the largest external contour of the binary image. Returns false
// when neither yields any points.
static bool OpenCVResolvePoints(const Mat &current, NSDictionary *params,
                                std::vector<cv::Point> &out) {
    id raw = params[@"points"];
    if ([raw isKindOfClass:[NSArray class]] && [(NSArray *)raw count] > 0) {
        for (id p in (NSArray *)raw) {
            if ([p isKindOfClass:[NSArray class]] && [(NSArray *)p count] >= 2) {
                out.emplace_back([((NSArray *)p)[0] intValue], [((NSArray *)p)[1] intValue]);
            }
        }
        return !out.empty();
    }
    Mat gray = OpenCVEnsureGray(current);
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(gray, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    if (contours.empty()) { return false; }
    auto largest = std::max_element(contours.begin(), contours.end(),
        [](const std::vector<cv::Point> &a, const std::vector<cv::Point> &b) {
            return cv::contourArea(a) < cv::contourArea(b);
        });
    out = *largest;
    return !out.empty();
}

// Axis-aligned bounding box of explicit points, or of the largest contour.
OPENCV_REGISTER_DATA_OP(boundingRect, @"boundingRect",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    id box = [NSNull null];
    if (found) {
        cv::Rect r = cv::boundingRect(pts);
        box = @{ @"x": @(r.x), @"y": @(r.y), @"width": @(r.width), @"height": @(r.height) };
    }
    return @{
        @"found": @(found),
        @"boundingBox": box,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
