#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Deskew/flatten a quadrilateral region to a straight rectangle by mapping the
// four source points onto the corners of a width x height output.
OPENCV_REGISTER_OP(fourPointTransform, @"fourPointTransform",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    id raw = params[@"points"];
    if (![raw isKindOfClass:[NSArray class]] || [(NSArray *)raw count] < 4) {
        if (error) *error = OpenCVMakeError(@"fourPointTransform 'points' must be four [x, y] pairs");
        return Mat();
    }
    NSArray *pts = (NSArray *)raw;
    cv::Point2f src[4];
    for (int i = 0; i < 4; i++) {
        NSArray *p = pts[i];
        if (![p isKindOfClass:[NSArray class]] || p.count < 2) {
            if (error) *error = OpenCVMakeError(@"fourPointTransform 'points' must be four [x, y] pairs");
            return Mat();
        }
        src[i] = cv::Point2f([p[0] floatValue], [p[1] floatValue]);
    }

    int width = params[@"width"] ? [params[@"width"] intValue] : current.cols;
    int height = params[@"height"] ? [params[@"height"] intValue] : current.rows;
    if (width <= 0 || height <= 0) {
        if (error) *error = OpenCVMakeError(@"fourPointTransform 'width'/'height' must be > 0");
        return Mat();
    }

    cv::Point2f dst[4] = {
        cv::Point2f(0, 0),
        cv::Point2f(width - 1, 0),
        cv::Point2f(width - 1, height - 1),
        cv::Point2f(0, height - 1),
    };
    Mat transform = cv::getPerspectiveTransform(src, dst);
    Mat out;
    cv::warpPerspective(current, out, transform, cv::Size(width, height));
    return out;
});
