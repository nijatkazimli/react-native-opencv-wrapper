#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Detect circles via the Hough gradient method. Operates on grayscale; the
// image is converted automatically.
OPENCV_REGISTER_DATA_OP(houghCircles, @"houghCircles",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    double dp = params[@"dp"] ? [params[@"dp"] doubleValue] : 1.0;
    double minDist = params[@"minDist"] ? [params[@"minDist"] doubleValue] : 20.0;
    double param1 = params[@"param1"] ? [params[@"param1"] doubleValue] : 100.0;
    double param2 = params[@"param2"] ? [params[@"param2"] doubleValue] : 30.0;
    int minRadius = params[@"minRadius"] ? [params[@"minRadius"] intValue] : 0;
    int maxRadius = params[@"maxRadius"] ? [params[@"maxRadius"] intValue] : 0;
    if (dp <= 0 || minDist <= 0 || param1 <= 0 || param2 <= 0) {
        if (error) *error = OpenCVMakeError(@"houghCircles dp, minDist, param1 and param2 must be positive");
        return nil;
    }

    Mat gray = OpenCVEnsureGray(current);
    std::vector<cv::Vec3f> found;
    cv::HoughCircles(gray, found, cv::HOUGH_GRADIENT, dp, minDist, param1, param2,
                     minRadius, maxRadius);

    NSMutableArray<NSDictionary *> *circles = [NSMutableArray array];
    for (const cv::Vec3f &c : found) {
        [circles addObject:@{ @"x": @(c[0]), @"y": @(c[1]), @"radius": @(c[2]) }];
    }

    return @{
        @"found": @(circles.count > 0),
        @"count": @(circles.count),
        @"circles": circles,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
