#import "../OpenCVOpRegistry.h"

#import <algorithm>
#import <cmath>
#import <vector>

using cv::Mat;
using cv::Point;
using cv::Point2f;

// A detected quad must cover at least this fraction of the frame to be treated
// as the document, so small rectangular artefacts are ignored.
static const double kScanMinAreaRatio = 0.10;

// Detect on a downscaled copy so Canny thresholds and contour approximation
// behave consistently regardless of the source megapixels (and much faster).
static const double kScanWorkSize = 500.0;

// Try increasingly coarse polygon approximations so documents whose border is
// slightly curved or noisy still reduce to four corners.
static const double kScanEpsSweep[] = {0.02, 0.03, 0.04, 0.05, 0.06, 0.08};

// Order four corners as top-left, top-right, bottom-right, bottom-left using the
// classic sum/diff heuristic: tl has the smallest x+y, br the largest; tr has
// the smallest (y-x), bl the largest.
static void OpenCVOrderCorners(const std::vector<Point> &in, Point2f out[4]) {
    double minSum = INFINITY, maxSum = -INFINITY;
    double minDiff = INFINITY, maxDiff = -INFINITY;
    Point2f tl, tr, br, bl;
    for (const Point &p : in) {
        double sum = (double)p.x + (double)p.y;
        double diff = (double)p.y - (double)p.x;
        if (sum < minSum) { minSum = sum; tl = Point2f((float)p.x, (float)p.y); }
        if (sum > maxSum) { maxSum = sum; br = Point2f((float)p.x, (float)p.y); }
        if (diff < minDiff) { minDiff = diff; tr = Point2f((float)p.x, (float)p.y); }
        if (diff > maxDiff) { maxDiff = diff; bl = Point2f((float)p.x, (float)p.y); }
    }
    out[0] = tl;
    out[1] = tr;
    out[2] = br;
    out[3] = bl;
}

// Median grayscale intensity, used to derive Canny thresholds that adapt to the
// image's overall brightness/contrast.
static double OpenCVMedianIntensity(const Mat &gray) {
    std::vector<uchar> values;
    values.reserve(gray.total());
    if (gray.isContinuous()) {
        values.assign(gray.datastart, gray.dataend);
    } else {
        for (int r = 0; r < gray.rows; r++) {
            const uchar *row = gray.ptr<uchar>(r);
            values.insert(values.end(), row, row + gray.cols);
        }
    }
    if (values.empty()) { return 128.0; }
    size_t mid = values.size() / 2;
    std::nth_element(values.begin(), values.begin() + mid, values.end());
    return (double)values[mid];
}

// Find the largest convex 4-point contour that covers at least
// `kScanMinAreaRatio` of the image. Returns true and fills `quad` (in the
// coordinate space of `image`) on success.
static BOOL OpenCVFindDocumentQuad(const Mat &image, std::vector<Point> &quad) {
    Mat gray = OpenCVEnsureGray(image);

    double longSide = (double)std::max(image.cols, image.rows);
    double scale = longSide > kScanWorkSize ? kScanWorkSize / longSide : 1.0;
    Mat work;
    if (scale != 1.0) {
        cv::resize(gray, work,
                   cv::Size((int)std::lround(image.cols * scale),
                            (int)std::lround(image.rows * scale)),
                   0, 0, cv::INTER_AREA);
    } else {
        work = gray;
    }

    Mat blurred;
    cv::GaussianBlur(work, blurred, cv::Size(5, 5), 0);
    double median = OpenCVMedianIntensity(blurred);
    double lo = std::max(0.0, 0.66 * median);
    double hi = std::min(255.0, 1.33 * median);
    Mat edges;
    cv::Canny(blurred, edges, lo, hi);
    Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(5, 5));
    cv::morphologyEx(edges, edges, cv::MORPH_CLOSE, kernel);

    std::vector<std::vector<Point>> contours;
    cv::findContours(edges, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    std::sort(contours.begin(), contours.end(),
              [](const std::vector<Point> &a, const std::vector<Point> &b) {
                  return cv::contourArea(a) > cv::contourArea(b);
              });

    double minArea = kScanMinAreaRatio * (double)work.cols * (double)work.rows;
    size_t limit = std::min<size_t>(contours.size(), 10);
    size_t epsCount = sizeof(kScanEpsSweep) / sizeof(kScanEpsSweep[0]);
    for (size_t i = 0; i < limit; i++) {
        double peri = cv::arcLength(contours[i], true);
        for (size_t e = 0; e < epsCount; e++) {
            std::vector<Point> approx;
            cv::approxPolyDP(contours[i], approx, kScanEpsSweep[e] * peri, true);
            if (approx.size() == 4 && cv::isContourConvex(approx) &&
                cv::contourArea(approx) >= minArea) {
                if (scale != 1.0) {
                    double inv = 1.0 / scale;
                    for (Point &p : approx) {
                        p.x = (int)std::lround(p.x * inv);
                        p.y = (int)std::lround(p.y * inv);
                    }
                }
                quad = approx;
                return YES;
            }
        }
    }
    return NO;
}

OPENCV_REGISTER_OP(scanDocument, @"scanDocument",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    std::vector<Point> quad;
    if (!OpenCVFindDocumentQuad(current, quad)) {
        if (error) {
            *error = OpenCVMakeCodedError(OpenCVErrorDocumentNotFound,
                @"scanDocument: no document-like quadrilateral found");
        }
        return Mat();
    }

    Point2f src[4];
    OpenCVOrderCorners(quad, src);

    double widthTop = cv::norm(src[1] - src[0]);
    double widthBottom = cv::norm(src[2] - src[3]);
    double heightLeft = cv::norm(src[3] - src[0]);
    double heightRight = cv::norm(src[2] - src[1]);
    int outW = std::max(1, (int)std::lround(std::max(widthTop, widthBottom)));
    int outH = std::max(1, (int)std::lround(std::max(heightLeft, heightRight)));

    // Optional aspect-ratio override (width / height): expand the shorter side
    // so the document keeps at least its detected resolution.
    id aspectValue = params[@"aspectRatio"];
    if ([aspectValue isKindOfClass:[NSNumber class]]) {
        double target = [aspectValue doubleValue];
        if (target > 0) {
            double currentRatio = (double)outW / (double)outH;
            if (target >= currentRatio) {
                outW = std::max(1, (int)std::lround(outH * target));
            } else {
                outH = std::max(1, (int)std::lround(outW / target));
            }
        }
    }

    Point2f dst[4] = {
        Point2f(0, 0),
        Point2f((float)(outW - 1), 0),
        Point2f((float)(outW - 1), (float)(outH - 1)),
        Point2f(0, (float)(outH - 1)),
    };

    Mat transform = cv::getPerspectiveTransform(src, dst);
    Mat warped;
    cv::warpPerspective(current, warped, transform, cv::Size(outW, outH));

    // Output rendering mode: "color" (default), "gray", or "bw".
    id modeValue = params[@"mode"];
    NSString *mode = [modeValue isKindOfClass:[NSString class]] ? modeValue : @"color";
    if ([mode isEqualToString:@"gray"] || [mode isEqualToString:@"bw"]) {
        Mat gray = OpenCVEnsureGray(warped);
        if ([mode isEqualToString:@"bw"]) {
            Mat bw;
            cv::adaptiveThreshold(gray, bw, 255, cv::ADAPTIVE_THRESH_GAUSSIAN_C,
                                  cv::THRESH_BINARY, 31, 10);
            return bw;
        }
        return gray;
    }
    return warped;
});
