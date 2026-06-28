#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Parse a 1D number array param into a column-vector `CV_64F` Mat. Returns an
// empty Mat and sets `*error` on bad shape.
static Mat SepFilter1DKernel(NSDictionary *params, NSString *key, NSError **error) {
    id value = params[key];
    if (![value isKindOfClass:[NSArray class]] || [(NSArray *)value count] == 0) {
        if (error) *error = OpenCVMakeError([NSString
            stringWithFormat:@"sepFilter2D '%@' must be a non-empty array of numbers", key]);
        return Mat();
    }
    NSArray *values = (NSArray *)value;
    Mat kernel((int)values.count, 1, CV_64F);
    for (NSUInteger i = 0; i < values.count; i++) {
        id component = values[i];
        if (![component isKindOfClass:[NSNumber class]]) {
            if (error) *error = OpenCVMakeError([NSString
                stringWithFormat:@"sepFilter2D '%@' values must be numbers", key]);
            return Mat();
        }
        kernel.at<double>((int)i, 0) = [component doubleValue];
    }
    return kernel;
}

// Separable convolution (`cv::sepFilter2D`): applies `kernelX` across rows and
// `kernelY` down columns. Keeps the source depth/channels like `filter2D`.
OPENCV_REGISTER_OP(sepFilter2D, @"sepFilter2D",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat kernelX = SepFilter1DKernel(params, @"kernelX", error);
    if (kernelX.empty()) return Mat();
    Mat kernelY = SepFilter1DKernel(params, @"kernelY", error);
    if (kernelY.empty()) return Mat();
    double delta = params[@"delta"] ? [params[@"delta"] doubleValue] : 0.0;
    Mat out;
    cv::sepFilter2D(current, out, -1, kernelX, kernelY, cv::Point(-1, -1), delta);
    return out;
});
