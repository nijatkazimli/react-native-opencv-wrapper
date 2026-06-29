#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Per-channel mean and standard deviation of the current image.
OPENCV_REGISTER_DATA_OP(meanStdDev, @"meanStdDev",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    Mat meanMat, stddevMat;
    cv::meanStdDev(current, meanMat, stddevMat);
    int channels = current.channels();
    NSMutableArray<NSNumber *> *mean = [NSMutableArray array];
    NSMutableArray<NSNumber *> *stddev = [NSMutableArray array];
    for (int i = 0; i < channels; i++) {
        [mean addObject:@(meanMat.at<double>(i))];
        [stddev addObject:@(stddevMat.at<double>(i))];
    }
    return @{
        @"mean": mean,
        @"stddev": stddev,
        @"channels": @(channels),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
