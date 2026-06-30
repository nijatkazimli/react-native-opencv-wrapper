#import "../OpenCVOpRegistry.h"

using cv::Mat;

// k-means color quantization: map every pixel to the nearest of `k` dominant
// colors.
OPENCV_REGISTER_OP(kmeans, @"kmeans",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    OpenCVKmeansResult km;
    if (!OpenCVRunKmeansBgr(current, params, 8, @"kmeans", &km, error)) return Mat();

    Mat quantized(km.sampleCount, 3, CV_8U);
    for (int i = 0; i < km.sampleCount; i++) {
        int cluster = km.labels.at<int>(i, 0);
        quantized.at<uchar>(i, 0) = cv::saturate_cast<uchar>(km.centers.at<float>(cluster, 0));
        quantized.at<uchar>(i, 1) = cv::saturate_cast<uchar>(km.centers.at<float>(cluster, 1));
        quantized.at<uchar>(i, 2) = cv::saturate_cast<uchar>(km.centers.at<float>(cluster, 2));
    }
    return quantized.reshape(3, current.rows).clone();
});
