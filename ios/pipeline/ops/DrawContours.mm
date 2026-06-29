#import "../OpenCVOpRegistry.h"

#import <vector>

using cv::Mat;

// Detect external contours of the (binary) image and draw them onto a color
// copy — a quick visualization of what findContours found.
OPENCV_REGISTER_OP(drawContours, @"drawContours",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    cv::Scalar color = OpenCVColorScalar(params[@"color"], cv::Scalar(0, 255, 0));
    int thickness = params[@"thickness"] ? [params[@"thickness"] intValue] : 2;
    double minArea = params[@"minArea"] ? [params[@"minArea"] doubleValue] : 0.0;
    int lineType = OpenCVAntialias(params) ? cv::LINE_AA : cv::LINE_8;

    Mat gray = OpenCVEnsureGray(current);
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(gray, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);

    Mat out;
    if (current.channels() == 1) {
        cv::cvtColor(current, out, cv::COLOR_GRAY2BGR);
    } else {
        out = current.clone();
    }
    for (size_t i = 0; i < contours.size(); i++) {
        if (cv::contourArea(contours[i]) < minArea) { continue; }
        cv::drawContours(out, contours, (int)i, color, thickness, lineType);
    }
    return out;
});
