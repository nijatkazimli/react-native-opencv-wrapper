#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Convex hull of explicit points, or of the largest contour.
OPENCV_REGISTER_DATA_OP(convexHull, @"convexHull",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    NSMutableArray<NSDictionary *> *hull = [NSMutableArray array];
    if (found) {
        std::vector<cv::Point> h;
        cv::convexHull(pts, h);
        for (const cv::Point &p : h) {
            [hull addObject:@{ @"x": @(p.x), @"y": @(p.y) }];
        }
    }
    return @{
        @"found": @(found),
        @"hull": hull,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
