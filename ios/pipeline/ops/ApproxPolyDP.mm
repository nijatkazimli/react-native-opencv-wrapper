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

// Simplify a polygon (explicit points or the largest contour) to corner
// vertices with Ramer–Douglas–Peucker. `epsilon` is a fraction of perimeter.
OPENCV_REGISTER_DATA_OP(approxPolyDP, @"approxPolyDP",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    double epsilon = params[@"epsilon"] ? [params[@"epsilon"] doubleValue] : 0.02;
    BOOL closed = params[@"closed"] ? [params[@"closed"] boolValue] : YES;
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);

    NSMutableArray<NSDictionary *> *points = [NSMutableArray array];
    if (found) {
        double peri = cv::arcLength(pts, closed);
        std::vector<cv::Point> approx;
        cv::approxPolyDP(pts, approx, epsilon * peri, closed);
        for (const cv::Point &p : approx) {
            [points addObject:@{ @"x": @(p.x), @"y": @(p.y) }];
        }
    }
    return @{
        @"found": @(found),
        @"points": points,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
