#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Extract the `k` dominant colors with k-means and return each one as RGB + hex
// with its pixel population and image fraction, ordered most-dominant first.
// Unlike `kmeans` (which posterizes the image), this returns the palette as
// data.
OPENCV_REGISTER_DATA_OP(dominantColors, @"dominantColors",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    int k = params[@"k"] ? [params[@"k"] intValue] : 5;
    if (k < 1) {
        if (error) *error = OpenCVMakeError(@"dominantColors 'k' must be >= 1");
        return nil;
    }
    int attempts = params[@"attempts"] ? [params[@"attempts"] intValue] : 3;
    if (attempts < 1) { attempts = 1; }
    int iterations = params[@"iterations"] ? [params[@"iterations"] intValue] : 10;
    if (iterations < 1) { iterations = 1; }

    Mat img;
    if (current.channels() == 1) {
        cv::cvtColor(current, img, cv::COLOR_GRAY2BGR);
    } else {
        img = current;
    }

    int sampleCount = img.rows * img.cols;
    if (k > sampleCount) { k = sampleCount; }

    Mat data;
    img.convertTo(data, CV_32F);
    data = data.reshape(1, sampleCount);  // sampleCount x 3

    Mat labels, centers;
    cv::TermCriteria crit(cv::TermCriteria::EPS + cv::TermCriteria::MAX_ITER,
                          iterations, 1.0);
    cv::kmeans(data, k, labels, crit, attempts, cv::KMEANS_PP_CENTERS, centers);

    std::vector<int> populations(k, 0);
    for (int i = 0; i < sampleCount; i++) {
        populations[labels.at<int>(i, 0)]++;
    }

    NSMutableArray<NSDictionary *> *colors = [NSMutableArray arrayWithCapacity:k];
    for (int c = 0; c < k; c++) {
        // centers are BGR; expose RGB to JS.
        int b = cv::saturate_cast<uchar>(centers.at<float>(c, 0));
        int g = cv::saturate_cast<uchar>(centers.at<float>(c, 1));
        int r = cv::saturate_cast<uchar>(centers.at<float>(c, 2));
        [colors addObject:@{
            @"color": @{ @"r": @(r), @"g": @(g), @"b": @(b) },
            @"hex": [NSString stringWithFormat:@"#%02X%02X%02X", r, g, b],
            @"population": @(populations[c]),
            @"fraction": @((double)populations[c] / sampleCount),
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
