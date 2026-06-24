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

// Find the largest convex 4-point contour that covers at least
// `kScanMinAreaRatio` of the image. Returns true and fills `quad` on success.
static BOOL OpenCVFindDocumentQuad(const Mat &image, std::vector<Point> &quad) {
    Mat gray = OpenCVEnsureGray(image);
    Mat blurred;
    cv::GaussianBlur(gray, blurred, cv::Size(5, 5), 0);
    Mat edges;
    cv::Canny(blurred, edges, 50, 150);
    Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
    cv::dilate(edges, edges, kernel);

    std::vector<std::vector<Point>> contours;
    cv::findContours(edges, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    std::sort(contours.begin(), contours.end(),
              [](const std::vector<Point> &a, const std::vector<Point> &b) {
                  return cv::contourArea(a) > cv::contourArea(b);
              });

    double minArea = kScanMinAreaRatio * (double)image.cols * (double)image.rows;
    size_t limit = std::min<size_t>(contours.size(), 10);
    for (size_t i = 0; i < limit; i++) {
        double peri = cv::arcLength(contours[i], true);
        std::vector<Point> approx;
        cv::approxPolyDP(contours[i], approx, 0.02 * peri, true);
        if (approx.size() == 4 && cv::isContourConvex(approx) &&
            cv::contourArea(approx) >= minArea) {
            quad = approx;
            return YES;
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

    Point2f dst[4] = {
        Point2f(0, 0),
        Point2f((float)(outW - 1), 0),
        Point2f((float)(outW - 1), (float)(outH - 1)),
        Point2f(0, (float)(outH - 1)),
    };

    Mat transform = cv::getPerspectiveTransform(src, dst);
    Mat warped;
    cv::warpPerspective(current, warped, transform, cv::Size(outW, outH));
    return warped;
});
