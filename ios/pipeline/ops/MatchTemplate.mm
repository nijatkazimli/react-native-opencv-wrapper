#import "../OpenCVOpRegistry.h"

using cv::Mat;

static int OpenCVTemplateMethod(NSString *name) {
    if ([name isEqualToString:@"sqdiff"]) { return cv::TM_SQDIFF; }
    if ([name isEqualToString:@"sqdiffNormed"]) { return cv::TM_SQDIFF_NORMED; }
    if ([name isEqualToString:@"ccorr"]) { return cv::TM_CCORR; }
    if ([name isEqualToString:@"ccorrNormed"]) { return cv::TM_CCORR_NORMED; }
    if ([name isEqualToString:@"ccoeff"]) { return cv::TM_CCOEFF; }
    return cv::TM_CCOEFF_NORMED;
}

// Locate a smaller template image within the current image and return the best
// match location and score.
OPENCV_REGISTER_DATA_OP(matchTemplate, @"matchTemplate",
                        ^NSDictionary *(const Mat &current, NSDictionary *params, NSError **error) {
    NSString *source = OpenCVOptionalString(params, @"template");
    if (source == nil) {
        if (error) *error = OpenCVMakeError(@"matchTemplate 'template' must be a string path or base64 image");
        return nil;
    }
    Mat tmplColor = OpenCVDecodeImageArg(source, error);
    if (tmplColor.empty()) { return nil; }

    Mat img = OpenCVEnsureGray(current);
    Mat tmpl = OpenCVEnsureGray(tmplColor);
    if (tmpl.cols > img.cols || tmpl.rows > img.rows) {
        if (error) *error = OpenCVMakeError(@"matchTemplate template must not be larger than the image");
        return nil;
    }

    int method = OpenCVTemplateMethod(OpenCVOptionalString(params, @"method"));
    Mat result;
    cv::matchTemplate(img, tmpl, result, method);
    double minVal = 0, maxVal = 0;
    cv::Point minLoc, maxLoc;
    cv::minMaxLoc(result, &minVal, &maxVal, &minLoc, &maxLoc);

    bool useMin = (method == cv::TM_SQDIFF || method == cv::TM_SQDIFF_NORMED);
    cv::Point loc = useMin ? minLoc : maxLoc;
    double score = useMin ? minVal : maxVal;

    return @{
        @"found": @(YES),
        @"score": @(score),
        @"location": @{ @"x": @(loc.x), @"y": @(loc.y) },
        @"templateWidth": @(tmpl.cols),
        @"templateHeight": @(tmpl.rows),
        @"width": @(current.cols),
        @"height": @(current.rows),
    };
});
