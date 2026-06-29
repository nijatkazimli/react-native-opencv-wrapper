#import "../OpenCVOpRegistry.h"

using cv::Mat;

// GrabCut foreground extraction seeded by a rectangle; background pixels in the
// result are set to black.
OPENCV_REGISTER_OP(grabCut, @"grabCut",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    id raw = params[@"rect"];
    if (![raw isKindOfClass:[NSDictionary class]]) {
        if (error) *error = OpenCVMakeError(@"grabCut 'rect' must be an object {x, y, width, height}");
        return Mat();
    }
    NSDictionary *r = (NSDictionary *)raw;
    int iterations = params[@"iterations"] ? [params[@"iterations"] intValue] : 5;
    if (iterations < 1) { iterations = 1; }

    Mat img;
    if (current.channels() == 1) {
        cv::cvtColor(current, img, cv::COLOR_GRAY2BGR);
    } else {
        img = current;
    }

    cv::Rect rect([r[@"x"] intValue], [r[@"y"] intValue],
                  [r[@"width"] intValue], [r[@"height"] intValue]);
    rect &= cv::Rect(0, 0, img.cols, img.rows);
    if (rect.width <= 0 || rect.height <= 0) {
        if (error) *error = OpenCVMakeError(@"grabCut 'rect' must overlap the image with positive size");
        return Mat();
    }

    Mat mask, bgdModel, fgdModel;
    cv::grabCut(img, mask, rect, bgdModel, fgdModel, iterations, cv::GC_INIT_WITH_RECT);

    Mat foreground = (mask == cv::GC_FGD) | (mask == cv::GC_PR_FGD);
    Mat out = Mat::zeros(img.size(), img.type());
    img.copyTo(out, foreground);
    return out;
});
