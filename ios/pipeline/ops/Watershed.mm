#import "../OpenCVOpRegistry.h"

using cv::Mat;

// Marker-based watershed segmentation with automatically derived markers; the
// detected region boundaries are drawn onto the image.
OPENCV_REGISTER_OP(watershed, @"watershed",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    Mat img;
    if (current.channels() == 1) {
        cv::cvtColor(current, img, cv::COLOR_GRAY2BGR);
    } else {
        img = current.clone();
    }

    Mat gray;
    cv::cvtColor(img, gray, cv::COLOR_BGR2GRAY);
    Mat thresh;
    cv::threshold(gray, thresh, 0, 255, cv::THRESH_BINARY_INV | cv::THRESH_OTSU);

    Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
    Mat opening;
    cv::morphologyEx(thresh, opening, cv::MORPH_OPEN, kernel, cv::Point(-1, -1), 2);

    Mat sureBg;
    cv::dilate(opening, sureBg, kernel, cv::Point(-1, -1), 3);

    Mat dist;
    cv::distanceTransform(opening, dist, cv::DIST_L2, 5);
    double minVal = 0, maxVal = 0;
    cv::minMaxLoc(dist, &minVal, &maxVal);
    Mat sureFg;
    cv::threshold(dist, sureFg, 0.7 * maxVal, 255, cv::THRESH_BINARY);
    sureFg.convertTo(sureFg, CV_8U);

    Mat unknown;
    cv::subtract(sureBg, sureFg, unknown);

    Mat markers;
    cv::connectedComponents(sureFg, markers);
    markers = markers + 1;
    markers.setTo(0, unknown);

    cv::watershed(img, markers);

    cv::Scalar line = OpenCVColorScalar(params[@"lineColor"], cv::Scalar(0, 0, 255));
    cv::Vec3b lineColor((uchar)line[0], (uchar)line[1], (uchar)line[2]);
    Mat out = img.clone();
    for (int i = 0; i < markers.rows; i++) {
        for (int j = 0; j < markers.cols; j++) {
            if (markers.at<int>(i, j) == -1) {
                out.at<cv::Vec3b>(i, j) = lineColor;
            }
        }
    }
    return out;
});
