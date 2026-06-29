#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Intensity histogram of one channel over [0, 256), quantized into `bins`.
OPENCV_REGISTER_DATA_OP(calcHist, @"calcHist",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    int bins = params[@"bins"] ? [params[@"bins"] intValue] : 256;
    if (bins < 1) { bins = 1; }
    if (bins > 256) { bins = 256; }
    int channel = params[@"channel"] ? [params[@"channel"] intValue] : 0;
    if (channel < 0 || channel >= current.channels()) { channel = 0; }

    Mat hist;
    int histSize[] = { bins };
    float range[] = { 0.0f, 256.0f };
    const float *ranges[] = { range };
    int channels[] = { channel };
    cv::calcHist(&current, 1, channels, Mat(), hist, 1, histSize, ranges);

    NSMutableArray<NSNumber *> *histogram = [NSMutableArray arrayWithCapacity:bins];
    for (int i = 0; i < bins; i++) {
        [histogram addObject:@((long)hist.at<float>(i))];
    }
    return @{
        @"bins": @(bins),
        @"channel": @(channel),
        @"histogram": histogram,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
