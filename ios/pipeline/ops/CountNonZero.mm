#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Count non-zero pixels of the (grayscale) image.
OPENCV_REGISTER_DATA_OP(countNonZero, @"countNonZero",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    Mat gray = OpenCVEnsureGray(current);
    int count = cv::countNonZero(gray);
    int total = current.cols * current.rows;
    double ratio = total > 0 ? (double)count / total : 0.0;
    return @{
        @"count": @(count),
        @"total": @(total),
        @"ratio": @(ratio),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
