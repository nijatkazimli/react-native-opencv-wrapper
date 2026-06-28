#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Detect line segments via the probabilistic Hough transform. Input should be
// edges (chain gray()+canny()); colour/gray images are reduced to gray first.
OPENCV_REGISTER_DATA_OP(houghLines, @"houghLines",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    double rho = params[@"rho"] ? [params[@"rho"] doubleValue] : 1.0;
    double theta = params[@"theta"] ? [params[@"theta"] doubleValue] : (M_PI / 180.0);
    int threshold = params[@"threshold"] ? [params[@"threshold"] intValue] : 80;
    double minLineLength = params[@"minLineLength"] ? [params[@"minLineLength"] doubleValue] : 30.0;
    double maxLineGap = params[@"maxLineGap"] ? [params[@"maxLineGap"] doubleValue] : 10.0;
    if (rho <= 0 || theta <= 0 || threshold <= 0) {
        if (error) *error = OpenCVMakeError(@"houghLines rho, theta and threshold must be positive");
        return nil;
    }

    Mat gray = OpenCVEnsureGray(current);
    std::vector<cv::Vec4i> segments;
    cv::HoughLinesP(gray, segments, rho, theta, threshold, minLineLength, maxLineGap);

    NSMutableArray<NSDictionary *> *lines = [NSMutableArray array];
    for (const cv::Vec4i &s : segments) {
        [lines addObject:@{ @"x1": @(s[0]), @"y1": @(s[1]), @"x2": @(s[2]), @"y2": @(s[3]) }];
    }

    return @{
        @"found": @(lines.count > 0),
        @"count": @(lines.count),
        @"lines": lines,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
