#import "../OpenCVOpRegistry.h"

#import <algorithm>
#import <vector>

using cv::Mat;

// Label connected foreground regions and return area/bbox/centroid per
// component (background label 0 excluded), ordered largest-area first.
OPENCV_REGISTER_DATA_OP(connectedComponents, @"connectedComponents",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    int connectivity = params[@"connectivity"] ? [params[@"connectivity"] intValue] : 8;
    if (connectivity != 4 && connectivity != 8) {
        if (error) *error = OpenCVMakeError(@"connectedComponents connectivity must be 4 or 8");
        return nil;
    }
    double minArea = params[@"minArea"] ? [params[@"minArea"] doubleValue] : 0.0;

    Mat gray = OpenCVEnsureGray(current);
    Mat labels, stats, centroids;
    int total = cv::connectedComponentsWithStats(gray, labels, stats, centroids,
                                                 connectivity, CV_32S);

    NSMutableArray<NSDictionary *> *comps = [NSMutableArray array];
    for (int i = 1; i < total; i++) {  // skip background label 0
        double area = stats.at<int>(i, cv::CC_STAT_AREA);
        if (area < minArea) { continue; }
        [comps addObject:@{
            @"label": @(i),
            @"area": @(area),
            @"boundingBox": @{ @"x": @(stats.at<int>(i, cv::CC_STAT_LEFT)),
                               @"y": @(stats.at<int>(i, cv::CC_STAT_TOP)),
                               @"width": @(stats.at<int>(i, cv::CC_STAT_WIDTH)),
                               @"height": @(stats.at<int>(i, cv::CC_STAT_HEIGHT)) },
            @"centroid": @{ @"x": @(centroids.at<double>(i, 0)),
                            @"y": @(centroids.at<double>(i, 1)) },
        }];
    }
    [comps sortUsingComparator:^NSComparisonResult(NSDictionary *a, NSDictionary *b) {
        return [b[@"area"] compare:a[@"area"]];
    }];

    return @{
        @"found": @(comps.count > 0),
        @"count": @(comps.count),
        @"components": comps,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
