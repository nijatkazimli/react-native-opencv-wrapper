#import "../OpenCVOpRegistry.h"

#import <algorithm>
#import <cmath>
#import <vector>

using cv::Mat;

// Find contours and return per-contour shape metrics. Result:
// `{ "found": bool, "count": int, "contours": [...], "width": int, "height": int }`
// where each contour is `{ "area", "points": [...], "boundingBox": {...},
// "minAreaRect": {...} }`. The image is treated as a binary mask (non-zero =
// foreground); chain gray()+threshold()/canny() first for clean shapes.
OPENCV_REGISTER_DATA_OP(findContours, @"findContours",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *mode = [params[@"mode"] isKindOfClass:[NSString class]] ? params[@"mode"] : @"external";
    double minArea = params[@"minArea"] ? [params[@"minArea"] doubleValue] : 0.0;
    double epsilon = params[@"epsilon"] ? [params[@"epsilon"] doubleValue] : 0.0;

    int retr = [mode isEqualToString:@"list"] ? cv::RETR_LIST : cv::RETR_EXTERNAL;

    Mat gray = OpenCVEnsureGray(current);
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(gray, contours, retr, cv::CHAIN_APPROX_SIMPLE);

    std::sort(contours.begin(), contours.end(),
              [](const std::vector<cv::Point> &a, const std::vector<cv::Point> &b) {
                  return cv::contourArea(a) > cv::contourArea(b);
              });

    NSMutableArray<NSDictionary *> *out = [NSMutableArray array];
    for (const std::vector<cv::Point> &contour : contours) {
        double area = cv::contourArea(contour);
        if (area < minArea) { continue; }

        std::vector<cv::Point> pts = contour;
        if (epsilon > 0.0) {
            double peri = cv::arcLength(contour, true);
            cv::approxPolyDP(contour, pts, epsilon * peri, true);
        }

        NSMutableArray<NSDictionary *> *points = [NSMutableArray array];
        for (const cv::Point &p : pts) {
            [points addObject:@{ @"x": @(p.x), @"y": @(p.y) }];
        }

        cv::Rect box = cv::boundingRect(contour);
        cv::RotatedRect rr = cv::minAreaRect(contour);

        [out addObject:@{
            @"area": @(area),
            @"points": points,
            @"boundingBox": @{ @"x": @(box.x), @"y": @(box.y),
                               @"width": @(box.width), @"height": @(box.height) },
            @"minAreaRect": @{ @"centerX": @(rr.center.x), @"centerY": @(rr.center.y),
                               @"width": @(rr.size.width), @"height": @(rr.size.height),
                               @"angle": @(rr.angle) },
        }];
    }

    return @{
        @"found": @(out.count > 0),
        @"count": @(out.count),
        @"contours": out,
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
