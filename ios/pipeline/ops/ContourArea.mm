#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Enclosed area of explicit points, or of the largest contour.
OPENCV_REGISTER_DATA_OP(contourArea, @"contourArea",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<cv::Point> pts;
    bool found = OpenCVResolvePoints(current, params, pts);
    double area = found ? cv::contourArea(pts) : 0.0;
    return @{
        @"found": @(found),
        @"area": @(area),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
