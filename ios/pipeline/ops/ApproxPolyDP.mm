#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

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
