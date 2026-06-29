#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Best-fit ellipse (as its bounding rotated rect) of explicit points or the
// largest contour. Requires at least 5 points.
OPENCV_REGISTER_DATA_OP(fitEllipse, @"fitEllipse",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    bool ok = found && pts.size() >= 5;
    id ellipse = [NSNull null];
    if (ok) {
        cv::RotatedRect rr = cv::fitEllipse(pts);
        ellipse = @{ @"centerX": @(rr.center.x), @"centerY": @(rr.center.y),
                     @"width": @(rr.size.width), @"height": @(rr.size.height),
                     @"angle": @(rr.angle) };
    }
    return @{
        @"found": @(ok),
        @"ellipse": ellipse,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
