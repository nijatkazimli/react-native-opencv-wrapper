#import "../OpenCVOpRegistry.h"

#import <string>

using cv::Mat;

// Pass-through tap: write the current image to `path` and return it unchanged.
// The encoder is chosen from `path`'s extension (e.g. `.png`, `.jpg`).
OPENCV_REGISTER_OP(debug, @"debug",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *path = OpenCVOptionalString(params, @"path");
    if (path.length == 0) {
        if (error) *error = OpenCVMakeError(@"debug 'path' is required and must be a non-empty string");
        return Mat();
    }
    if (!cv::imwrite(std::string([path UTF8String]), current)) {
        if (error) *error = OpenCVMakeCodedError(OpenCVErrorIO,
            [NSString stringWithFormat:@"Could not write debug image to %@", path]);
        return Mat();
    }
    return current;
});
