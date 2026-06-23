// OpenCVOpRegistry
// -----------------------------------------------------------------------------
// Orchestrator for the native pipeline. Each OpenCV operation lives in its own
// file under `ios/pipeline/ops/` and self-registers via OPENCV_REGISTER_OP, so
// adding an op never touches this registry or the TurboModule. The registry
// reads the input once, applies the queued ops in memory, and writes once.

#ifdef __cplusplus
#import <opencv2/opencv.hpp>
#endif

#import <Foundation/Foundation.h>

#ifdef __cplusplus

/// Handler for a single pipeline op: receives the current image and the op's
/// JSON params, and returns the next image. On failure it returns an empty
/// `cv::Mat` and populates `*error`.
typedef cv::Mat (^OpenCVOpHandler)(const cv::Mat &current,
                                   NSDictionary *params,
                                   NSError **error);

@interface OpenCVOpRegistry : NSObject

/// Register a handler under `name`. Called automatically by OPENCV_REGISTER_OP.
+ (void)registerOp:(NSString *)name handler:(OpenCVOpHandler)handler;

/// Look up a previously registered handler, or `nil`.
+ (OpenCVOpHandler)handlerForName:(NSString *)name;

/// Read `inputPath` once, apply every op in the JSON array `opsJson` in order,
/// and write the result to `outputPath` once. Returns `NO` and sets `*error`
/// on any failure (bad JSON, unknown op, invalid params, read/write error).
+ (BOOL)runPipelineWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                     opsJson:(NSString *)opsJson
                       error:(NSError **)error;

/// Run a single registered op by name with params.
+ (BOOL)runSingleOpWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                      opName:(NSString *)opName
                      params:(NSDictionary *)params
                       error:(NSError **)error;

@end

// --- Shared helpers usable by op files --------------------------------------

/// Build an NSError in the wrapper's error domain with `message`.
NSError *OpenCVMakeError(NSString *message);

/// Return a single-channel copy of `src` (no-op if already grayscale).
cv::Mat OpenCVEnsureGray(const cv::Mat &src);

/// True when `k` is a positive odd integer (valid kernel size).
BOOL OpenCVOddPositive(int k);

// --- Self-registration macro -------------------------------------------------
//
// Usage (in an op's .mm file):
//
//   OPENCV_REGISTER_OP(gray, @"gray", ^cv::Mat(const cv::Mat &current,
//                                               NSDictionary *params,
//                                               NSError **error) {
//     return OpenCVEnsureGray(current);
//   });
//
// `IDENT` is any unique C identifier; `NAME` is the op key matching the JS
// `type`; `BLOCK` is an OpenCVOpHandler. The op registers at load time.
#define OPENCV_REGISTER_OP(IDENT, NAME, BLOCK)                                  \
  __attribute__((constructor)) static void _opencv_register_##IDENT(void) {    \
    [OpenCVOpRegistry registerOp:(NAME) handler:(BLOCK)];                       \
  }

#endif
