#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Extract the `k` dominant colors with k-means and return each one as RGB + hex
// with its pixel population and image fraction, ordered most-dominant first.
// Unlike `kmeans` (which posterizes the image), this returns the palette as
// data.
OPENCV_REGISTER_DATA_OP(dominantColors, @"dominantColors",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    OpenCVKmeansResult km;
    if (!OpenCVRunKmeansBgr(current, params, 5, @"dominantColors", &km, error)) return nil;

    std::vector<int> populations(km.k, 0);
    for (int i = 0; i < km.sampleCount; i++) {
        populations[km.labels.at<int>(i, 0)]++;
    }

    NSMutableArray<NSDictionary *> *colors = [NSMutableArray arrayWithCapacity:km.k];
    for (int c = 0; c < km.k; c++) {
        // centers are BGR; expose RGB to JS.
        int b = cv::saturate_cast<uchar>(km.centers.at<float>(c, 0));
        int g = cv::saturate_cast<uchar>(km.centers.at<float>(c, 1));
        int r = cv::saturate_cast<uchar>(km.centers.at<float>(c, 2));
        [colors addObject:@{
            @"color": @{ @"r": @(r), @"g": @(g), @"b": @(b) },
            @"hex": [NSString stringWithFormat:@"#%02X%02X%02X", r, g, b],
            @"population": @(populations[c]),
            @"fraction": @((double)populations[c] / km.sampleCount),
        }];
    }
    [colors sortUsingComparator:^NSComparisonResult(NSDictionary *a, NSDictionary *b) {
        return [b[@"population"] compare:a[@"population"]];
    }];

    return @{
        @"colors": colors,
        @"count": @(colors.count),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
