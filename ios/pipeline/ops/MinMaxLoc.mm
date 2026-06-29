#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Minimum/maximum intensity and their locations (single-channel).
OPENCV_REGISTER_DATA_OP(minMaxLoc, @"minMaxLoc",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    Mat gray = OpenCVEnsureGray(current);
    double minVal = 0, maxVal = 0;
    cv::Point minLoc, maxLoc;
    cv::minMaxLoc(gray, &minVal, &maxVal, &minLoc, &maxLoc);
    return @{
        @"min": @(minVal),
        @"max": @(maxVal),
        @"minLoc": @{ @"x": @(minLoc.x), @"y": @(minLoc.y) },
        @"maxLoc": @{ @"x": @(maxLoc.x), @"y": @(maxLoc.y) },
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
