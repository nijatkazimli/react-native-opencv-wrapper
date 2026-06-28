#import "../OpenCVOpRegistry.h"

#import <algorithm>
#import <vector>

using cv::Mat;

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

// Rotated minimum-area rectangle of explicit points, or of the largest contour.
OPENCV_REGISTER_DATA_OP(minAreaRect, @"minAreaRect",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    id rect = [NSNull null];
    if (found) {
        cv::RotatedRect rr = cv::minAreaRect(pts);
        rect = @{ @"centerX": @(rr.center.x), @"centerY": @(rr.center.y),
                  @"width": @(rr.size.width), @"height": @(rr.size.height),
                  @"angle": @(rr.angle) };
    }
    return @{
        @"found": @(found),
        @"minAreaRect": rect,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
