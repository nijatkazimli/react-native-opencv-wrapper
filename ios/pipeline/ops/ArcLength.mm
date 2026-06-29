#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Perimeter (closed) or curve length (open) of explicit points or the largest
// contour.
OPENCV_REGISTER_DATA_OP(arcLength, @"arcLength",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    BOOL closed = params[@"closed"] ? [params[@"closed"] boolValue] : YES;
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    double length = found ? cv::arcLength(pts, closed) : 0.0;
    return @{
        @"found": @(found),
        @"length": @(length),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
