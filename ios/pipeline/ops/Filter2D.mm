#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Parse the `kernel` param (a non-empty array of equal-length number rows)
// into a `CV_64F` Mat. Returns an empty Mat and sets `*error` on bad shape.
static Mat Filter2DKernel(NSDictionary *params, NSError **error) {
    id value = params[@"kernel"];
    if (![value isKindOfClass:[NSArray class]]) {
        if (error) *error = OpenCVMakeError(@"filter2D 'kernel' must be a 2D array of numbers");
        return Mat();
    }
    NSArray *rows = (NSArray *)value;
    if (rows.count == 0) {
        if (error) *error = OpenCVMakeError(@"filter2D 'kernel' must have at least one row");
        return Mat();
    }
    NSUInteger cols = 0;
    Mat kernel((int)rows.count, 0, CV_64F);
    for (NSUInteger r = 0; r < rows.count; r++) {
        id rawRow = rows[r];
        if (![rawRow isKindOfClass:[NSArray class]]) {
            if (error) *error = OpenCVMakeError(@"filter2D 'kernel' rows must be arrays of numbers");
            return Mat();
        }
        NSArray *row = (NSArray *)rawRow;
        if (r == 0) {
            cols = row.count;
            if (cols == 0) {
                if (error) *error = OpenCVMakeError(@"filter2D 'kernel' rows must not be empty");
                return Mat();
            }
            kernel = Mat((int)rows.count, (int)cols, CV_64F);
        } else if (row.count != cols) {
            if (error) *error = OpenCVMakeError(@"filter2D 'kernel' rows must all have the same length");
            return Mat();
        }
        for (NSUInteger c = 0; c < cols; c++) {
            id component = row[c];
            if (![component isKindOfClass:[NSNumber class]]) {
                if (error) *error = OpenCVMakeError(@"filter2D 'kernel' values must be numbers");
                return Mat();
            }
            kernel.at<double>((int)r, (int)c) = [component doubleValue];
        }
    }
    return kernel;
}

OPENCV_REGISTER_OP(filter2D, @"filter2D",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat kernel = Filter2DKernel(params, error);
    if (kernel.empty()) return Mat();
    Mat dst;
    cv::filter2D(current, dst, -1, kernel);
    return dst;
});
