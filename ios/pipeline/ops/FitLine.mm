#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Best-fit line (L2) through explicit points or the largest contour.
OPENCV_REGISTER_DATA_OP(fitLine, @"fitLine",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    id line = [NSNull null];
    if (found) {
        cv::Vec4f l;
        cv::fitLine(pts, l, cv::DIST_L2, 0, 0.01, 0.01);
        line = @{ @"vx": @(l[0]), @"vy": @(l[1]), @"x0": @(l[2]), @"y0": @(l[3]) };
    }
    return @{
        @"found": @(found),
        @"line": line,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
