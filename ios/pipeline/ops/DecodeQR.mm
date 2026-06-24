#import "../OpenCVOpRegistry.h"

#import <opencv2/core/version.hpp>
#import <opencv2/objdetect.hpp>

#import <string>
#import <vector>

using cv::Mat;
using cv::Point2f;

// QRCodeDetector::detectAndDecodeMulti was added in OpenCV 4.3.0. The host app
// may link its own OpenCV, so we guard both at compile time (in case we build
// against older headers) and at runtime (in case an older library is loaded).
#define RNOCV_HAS_QR_MULTI \
    ((CV_VERSION_MAJOR > 4) || (CV_VERSION_MAJOR == 4 && CV_VERSION_MINOR >= 3))

// Detect and decode every QR code in the current image. Returns a structured
// result: `{ "found": bool, "codes": [{ "value": string, "corners": [...] }] }`.
OPENCV_REGISTER_DATA_OP(decodeQR, @"decodeQR",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    if (cv::getVersionMajor() < 4 ||
        (cv::getVersionMajor() == 4 && cv::getVersionMinor() < 3)) {
        if (error) {
            *error = OpenCVMakeCodedError(
                OpenCVErrorUnavailable,
                [NSString stringWithFormat:@"decodeQR requires OpenCV >= 4.3.0 (found %s)",
                                           cv::getVersionString().c_str()]);
        }
        return nil;
    }

#if !RNOCV_HAS_QR_MULTI
    if (error) {
        *error = OpenCVMakeCodedError(
            OpenCVErrorUnavailable,
            @"decodeQR requires building against OpenCV >= 4.3.0");
    }
    return nil;
#else
    cv::QRCodeDetector detector;
    std::vector<std::string> infos;
    std::vector<Point2f> points;
    bool ok = false;
    try {
        ok = detector.detectAndDecodeMulti(current, infos, points);
    } catch (const cv::Exception &) {
        ok = false;
    }

    NSMutableArray<NSDictionary *> *codes = [NSMutableArray array];
    if (ok) {
        for (size_t i = 0; i < infos.size(); i++) {
            NSMutableArray<NSDictionary *> *corners = [NSMutableArray array];
            for (size_t j = 0; j < 4; j++) {
                size_t idx = i * 4 + j;
                if (idx < points.size()) {
                    [corners addObject:@{ @"x": @(points[idx].x), @"y": @(points[idx].y) }];
                }
            }
            [codes addObject:@{
                @"value": [NSString stringWithUTF8String:infos[i].c_str()] ?: @"",
                @"corners": corners,
            }];
        }
    }

    return @{ @"found": @(codes.count > 0), @"codes": codes };
#endif
});
