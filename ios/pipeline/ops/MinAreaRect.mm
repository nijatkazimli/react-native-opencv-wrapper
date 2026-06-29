#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

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
