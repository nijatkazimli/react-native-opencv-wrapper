#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Per-pixel intensity remap (`cv::LUT`). `table` is a 256-entry lookup table
// (built in JS from a function or array); the same table is applied to every
// channel of the current image.
OPENCV_REGISTER_OP(lut, @"lut",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    id raw = params[@"table"];
    if (![raw isKindOfClass:[NSArray class]] || [(NSArray *)raw count] != 256) {
        if (error) *error = OpenCVMakeError(@"lut 'table' must be an array of 256 values");
        return Mat();
    }
    NSArray *values = (NSArray *)raw;
    Mat table(1, 256, CV_8UC1);
    uchar *row = table.ptr<uchar>();
    for (int i = 0; i < 256; i++) {
        id value = values[i];
        if (![value isKindOfClass:[NSNumber class]]) {
            if (error) *error = OpenCVMakeError(@"lut 'table' must contain only numbers");
            return Mat();
        }
        int clamped = [value intValue];
        if (clamped < 0) clamped = 0;
        if (clamped > 255) clamped = 255;
        row[i] = (uchar)clamped;
    }
    Mat out;
    cv::LUT(current, table, out);
    return out;
});
