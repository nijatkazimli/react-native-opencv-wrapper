#import "../OpenCVOpRegistry.h"

using cv::Mat;

// k-means color quantization: map every pixel to the nearest of `k` dominant
// colors.
OPENCV_REGISTER_OP(kmeans, @"kmeans",
                   ^Mat(const Mat &current, NSDictionary *params, NSError **error) {
    int k = params[@"k"] ? [params[@"k"] intValue] : 8;
    if (k < 1) {
        if (error) *error = OpenCVMakeError(@"kmeans 'k' must be >= 1");
        return Mat();
    }
    int attempts = params[@"attempts"] ? [params[@"attempts"] intValue] : 3;
    if (attempts < 1) { attempts = 1; }
    int iterations = params[@"iterations"] ? [params[@"iterations"] intValue] : 10;
    if (iterations < 1) { iterations = 1; }

    Mat img;
    if (current.channels() == 1) {
        cv::cvtColor(current, img, cv::COLOR_GRAY2BGR);
    } else {
        img = current;
    }

    int sampleCount = img.rows * img.cols;
    if (k > sampleCount) { k = sampleCount; }

    Mat data;
    img.convertTo(data, CV_32F);
    data = data.reshape(1, sampleCount);  // sampleCount x 3

    Mat labels, centers;
    cv::TermCriteria crit(cv::TermCriteria::EPS + cv::TermCriteria::MAX_ITER,
                          iterations, 1.0);
    cv::kmeans(data, k, labels, crit, attempts, cv::KMEANS_PP_CENTERS, centers);

    Mat quantized(sampleCount, 3, CV_8U);
    for (int i = 0; i < sampleCount; i++) {
        int cluster = labels.at<int>(i, 0);
        quantized.at<uchar>(i, 0) = cv::saturate_cast<uchar>(centers.at<float>(cluster, 0));
        quantized.at<uchar>(i, 1) = cv::saturate_cast<uchar>(centers.at<float>(cluster, 1));
        quantized.at<uchar>(i, 2) = cv::saturate_cast<uchar>(centers.at<float>(cluster, 2));
    }
    return quantized.reshape(3, img.rows).clone();
});
