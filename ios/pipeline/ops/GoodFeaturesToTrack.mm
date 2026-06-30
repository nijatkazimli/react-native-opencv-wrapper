#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Detect corner feature points (Shi-Tomasi by default, or Harris when
// `useHarrisDetector` is set) and return them as a point list, strongest
// first. Operates on a grayscale view of the image.
OPENCV_REGISTER_DATA_OP(goodFeaturesToTrack, @"goodFeaturesToTrack",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    int maxCorners = params[@"maxCorners"] ? [params[@"maxCorners"] intValue] : 100;
    double qualityLevel = params[@"qualityLevel"] ? [params[@"qualityLevel"] doubleValue] : 0.01;
    if (qualityLevel <= 0.0) {
        if (error) *error = OpenCVMakeError(@"goodFeaturesToTrack 'qualityLevel' must be > 0");
        return nil;
    }
    double minDistance = params[@"minDistance"] ? [params[@"minDistance"] doubleValue] : 10.0;
    if (minDistance < 0.0) {
        if (error) *error = OpenCVMakeError(@"goodFeaturesToTrack 'minDistance' must be >= 0");
        return nil;
    }
    int blockSize = params[@"blockSize"] ? [params[@"blockSize"] intValue] : 3;
    if (blockSize < 1) {
        if (error) *error = OpenCVMakeError(@"goodFeaturesToTrack 'blockSize' must be >= 1");
        return nil;
    }
    bool useHarris = params[@"useHarrisDetector"] ? [params[@"useHarrisDetector"] boolValue] : false;
    double k = params[@"k"] ? [params[@"k"] doubleValue] : 0.04;

    Mat gray = OpenCVEnsureGray(current);
    std::vector<cv::Point2f> corners;
    cv::goodFeaturesToTrack(gray, corners, maxCorners, qualityLevel, minDistance,
                            cv::noArray(), blockSize, useHarris, k);

    NSMutableArray<NSDictionary *> *pts = [NSMutableArray arrayWithCapacity:corners.size()];
    for (const auto &p : corners) {
        [pts addObject:@{ @"x": @(p.x), @"y": @(p.y) }];
    }

    return @{
        @"found": @(pts.count > 0),
        @"count": @(pts.count),
        @"corners": pts,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
