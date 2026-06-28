#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Draw a polyline/polygon through the given points onto a copy of the current
// image. Useful for outlining detection quads (e.g. `detectDocument` corners).
OPENCV_REGISTER_OP(drawPolygon, @"drawPolygon",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    id rawPoints = params[@"points"];
    if (![rawPoints isKindOfClass:[NSArray class]] || [(NSArray *)rawPoints count] < 2) {
        if (error) *error = OpenCVMakeError(@"drawPolygon 'points' must have at least 2 points");
        return Mat();
    }
    if (!OpenCVRequireNumbers(params, @[@"thickness"], error)) return Mat();
    OpenCVDrawStyle style;
    if (!OpenCVResolveDrawStyle(params, @"drawPolygon", &style, error)) return Mat();
    std::vector<cv::Point> pts;
    for (id point in (NSArray *)rawPoints) {
        if (![point isKindOfClass:[NSArray class]] || [(NSArray *)point count] < 2) {
            if (error) *error = OpenCVMakeError(@"drawPolygon points must be [x, y] number pairs");
            return Mat();
        }
        id px = ((NSArray *)point)[0];
        id py = ((NSArray *)point)[1];
        if (![px isKindOfClass:[NSNumber class]] || ![py isKindOfClass:[NSNumber class]]) {
            if (error) *error = OpenCVMakeError(@"drawPolygon points must be [x, y] number pairs");
            return Mat();
        }
        pts.emplace_back([px intValue], [py intValue]);
    }
    BOOL closed = params[@"closed"] ? [params[@"closed"] boolValue] : YES;
    Mat dst = current.clone();
    std::vector<std::vector<cv::Point>> polys{pts};
    if (style.hasFill) {
        cv::fillPoly(dst, polys, style.fillColor, style.lineType);
    }
    cv::polylines(dst, polys, closed, style.color, style.thickness, style.lineType);
    return dst;
});
