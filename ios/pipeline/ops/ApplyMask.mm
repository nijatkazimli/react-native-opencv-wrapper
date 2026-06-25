#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Run the `mask` sub-pipeline on a copy of the current image to produce a
// single-channel mask, then keep only the current pixels the mask selects
// (zeroing the rest). The original image — not the mask — flows out.
OPENCV_REGISTER_OP(applyMask, @"applyMask",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    id rawOps = params[@"mask"];
    if (![rawOps isKindOfClass:[NSArray class]]) {
        if (error) *error = OpenCVMakeError(@"applyMask 'mask' must be an array of ops");
        return Mat();
    }
    Mat mask = current.clone();
    if (!OpenCVApplyOps((NSArray *)rawOps, mask, error)) {
        return Mat();
    }
    if (mask.channels() != 1) {
        if (error) *error = OpenCVMakeError(@"applyMask sub-pipeline must produce a single-channel mask");
        return Mat();
    }
    if (mask.size() != current.size()) {
        if (error) *error = OpenCVMakeError(@"applyMask mask must match the current image size");
        return Mat();
    }
    Mat mask8;
    if (mask.type() != CV_8UC1) {
        mask.convertTo(mask8, CV_8UC1);
    } else {
        mask8 = mask;
    }
    Mat dst = Mat::zeros(current.size(), current.type());
    current.copyTo(dst, mask8);
    return dst;
});
