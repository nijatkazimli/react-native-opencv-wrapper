#import "../OpenCVOpRegistry.h"

using cv::Mat;
using cv::Scalar;

// Parse an array param (`lower`/`upper`) of 1–4 numbers into a `cv::Scalar`,
// writing the component count to `*count`. Returns NO and sets `*error` if the
// param is missing, the wrong type, or out of range.
static BOOL InRangeScalar(NSDictionary *params,
                          NSString *key,
                          Scalar *out,
                          NSUInteger *count,
                          NSError **error) {
    id value = params[key];
    if (![value isKindOfClass:[NSArray class]]) {
        if (error) *error = OpenCVMakeError(
            [NSString stringWithFormat:@"inRange '%@' must be an array of numbers", key]);
        return NO;
    }
    NSArray *array = (NSArray *)value;
    if (array.count < 1 || array.count > 4) {
        if (error) *error = OpenCVMakeError(
            [NSString stringWithFormat:@"inRange '%@' must have 1 to 4 components", key]);
        return NO;
    }
    Scalar scalar(0, 0, 0, 0);
    for (NSUInteger i = 0; i < array.count; i++) {
        id component = array[i];
        if (![component isKindOfClass:[NSNumber class]]) {
            if (error) *error = OpenCVMakeError(
                [NSString stringWithFormat:@"inRange '%@' components must be numbers", key]);
            return NO;
        }
        scalar[(int)i] = [component doubleValue];
    }
    *out = scalar;
    *count = array.count;
    return YES;
}

OPENCV_REGISTER_OP(inRange, @"inRange",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Scalar lower(0, 0, 0, 0);
    Scalar upper(0, 0, 0, 0);
    NSUInteger lowerCount = 0;
    NSUInteger upperCount = 0;
    if (!InRangeScalar(params, @"lower", &lower, &lowerCount, error)) return Mat();
    if (!InRangeScalar(params, @"upper", &upper, &upperCount, error)) return Mat();
    if (lowerCount != upperCount) {
        if (error) *error = OpenCVMakeError(@"inRange 'lower' and 'upper' must have the same length");
        return Mat();
    }
    if ((NSUInteger)current.channels() != lowerCount) {
        if (error) *error = OpenCVMakeError(
            [NSString stringWithFormat:@"inRange bounds have %lu components but the image has %d channel(s)",
             (unsigned long)lowerCount, current.channels()]);
        return Mat();
    }
    Mat mask;
    cv::inRange(current, lower, upper, mask);
    return mask;
});
