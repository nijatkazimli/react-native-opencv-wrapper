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

/// Handler for a single analysis op: receives the current image and the op's
/// JSON params, and returns a JSON-serializable `NSDictionary` of structured
/// results. On failure it returns `nil` and populates `*error`.
typedef NSDictionary *_Nullable (^OpenCVDataHandler)(const cv::Mat &current,
                                                     NSDictionary *params,
                                                     NSError **error);

@interface OpenCVOpRegistry : NSObject

/// Register a handler under `name`. Called automatically by OPENCV_REGISTER_OP.
+ (void)registerOp:(NSString *)name handler:(OpenCVOpHandler)handler;

/// Look up a previously registered handler, or `nil`.
+ (OpenCVOpHandler)handlerForName:(NSString *)name;

/// Register an analysis handler under `name`. Called automatically by
/// OPENCV_REGISTER_DATA_OP.
+ (void)registerDataOp:(NSString *)name handler:(OpenCVDataHandler)handler;

/// Look up a previously registered analysis handler, or `nil`.
+ (OpenCVDataHandler)dataHandlerForName:(NSString *)name;

/// Read `inputPath` once, apply every op in the JSON array `opsJson` in order,
/// and write the result to `outputPath` once. Returns `NO` and sets `*error`
/// on any failure (bad JSON, unknown op, invalid params, read/write error).
+ (BOOL)runPipelineWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                     opsJson:(NSString *)opsJson
                       error:(NSError **)error;

/// In-memory variant: `inputJson` / `outputJson` are JSON source/sink
/// descriptors (`{"kind":"path","value":...}` or `{"kind":"base64",...}`).
/// Reads/decodes the source once, applies every op in `opsJson`, then writes
/// or base64-encodes the result. Returns the output path or base64 string, or
/// `nil` (and sets `*error`) on failure.
+ (NSString *)runPipelineWithInputJson:(NSString *)inputJson
                            outputJson:(NSString *)outputJson
                               opsJson:(NSString *)opsJson
                                 error:(NSError **)error;

/// Run a single registered op by name with params.
+ (BOOL)runSingleOpWithInput:(NSString *)inputPath
                      output:(NSString *)outputPath
                      opName:(NSString *)opName
                      params:(NSDictionary *)params
                       error:(NSError **)error;

/// Data-returning variant: `inputJson` is a JSON source descriptor. Decodes the
/// source once, applies every op in `opsJson` except the last as transforms,
/// then runs the final op as a registered analysis op. Returns the analysis
/// result encoded as a JSON string, or `nil` (and sets `*error`) on failure.
+ (NSString *)runPipelineDataWithInputJson:(NSString *)inputJson
                                   opsJson:(NSString *)opsJson
                                     error:(NSError **)error;

@end

// --- Stable error codes (mirrored on Android) -------------------------------
//
// Carried in the NSError `userInfo` under `OpenCVErrorCodeKey` and surfaced to
// JS as the Promise rejection `code`, so callers can branch on the failure
// kind instead of string-matching messages.
extern NSString *const OpenCVErrorCodeKey;
extern NSString *const OpenCVErrorInvalidArgument;  // "opencv_invalid_argument"
extern NSString *const OpenCVErrorIO;               // "opencv_io_error"
extern NSString *const OpenCVErrorUnknownOp;        // "opencv_unknown_op"
extern NSString *const OpenCVErrorUnavailable;      // "opencv_unavailable"
extern NSString *const OpenCVErrorDocumentNotFound; // "opencv_document_not_found"

// --- Shared helpers usable by op files --------------------------------------

/// Build an NSError carrying the stable string `code` and `message`.
NSError *OpenCVMakeCodedError(NSString *code, NSString *message);

/// Build an invalid-argument NSError with `message`.
NSError *OpenCVMakeError(NSString *message);

/// Require that every key in `keys` is present in `params` and numeric.
/// Returns NO and sets `*error` (invalid argument) naming the first offender.
BOOL OpenCVRequireNumbers(NSDictionary *params,
                          NSArray<NSString *> *keys,
                          NSError **error);

/// Coerce `params[key]` to a present string, or `nil` if absent / not a string.
NSString *OpenCVOptionalString(NSDictionary *params, NSString *key);

/// Return a single-channel copy of `src` (no-op if already grayscale).
cv::Mat OpenCVEnsureGray(const cv::Mat &src);

/// True when `k` is a positive odd integer (valid kernel size).
BOOL OpenCVOddPositive(int k);

/// Convert a JS `[r, g, b]` color array (each 0–255) to a BGR `cv::Scalar` for
/// drawing ops. Returns `fallback` when the value is missing or malformed.
cv::Scalar OpenCVColorScalar(NSArray *color, cv::Scalar fallback);

/// Whether a drawing op should anti-alias its edges. Reads the optional
/// `antialias` param; defaults to `YES` when absent.
BOOL OpenCVAntialias(NSDictionary *params);

/// Resolved stroke/fill style shared by the drawing ops.
struct OpenCVDrawStyle {
  cv::Scalar color;      // stroke color (BGR), defaults to red
  int thickness;         // stroke thickness, >= 1
  int lineType;          // cv::LINE_AA or cv::LINE_8
  bool hasFill;          // YES when a fillColor was supplied
  cv::Scalar fillColor;  // fill color (BGR), valid only when hasFill
};

/// Resolve the common drawing parameters (`color`, `thickness`, `antialias`,
/// `fillColor`) for op `opName`. Returns NO and sets `*error` when `thickness`
/// is missing or < 1.
BOOL OpenCVResolveDrawStyle(NSDictionary *params, NSString *opName,
                            OpenCVDrawStyle *out, NSError **error);

/// Decode an image supplied as either a filesystem path (optionally `file://`)
/// or a (data-URI or raw) base64 string. Tries `imread` first, then base64.
/// Returns an empty `cv::Mat` and sets `*error` on failure.
cv::Mat OpenCVDecodeImageArg(NSString *value, NSError **error);

/// Resolve the points an analysis op should operate on: explicit
/// `params[@"points"]` (`[[x, y], ...]`) when present, otherwise the largest
/// external contour of the (binary) `current` image. Appends to `out` and
/// returns `NO` when neither source yields any points.
bool OpenCVResolvePoints(const cv::Mat &current, NSDictionary *params,
                         std::vector<cv::Point> &out);

/// Apply every op in the JSON-decoded `ops` array to `current` in place, in
/// order. Used by composite ops (e.g. `applyMask`) that run a sub-pipeline on a
/// copy of the current image. Returns `NO` and sets `*error` on the first
/// failing op.
BOOL OpenCVApplyOps(NSArray *ops, cv::Mat &current, NSError **error);

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
// `type`; the handler is an OpenCVOpHandler. The op registers in `+load` at
// image load time. The handler is taken as a variadic argument so its internal
// commas (e.g. in a `Point2f dst[4] = {...}` initializer) are not mistaken for
// macro argument separators.
//
// The registration is emitted as an Objective-C class (rather than a plain
// `__attribute__((constructor))` function) so that, when the pod is linked as
// a static library, the `-ObjC` linker flag force-loads each op's object file.
// Without this the linker would drop these otherwise-unreferenced translation
// units and no ops would register. The podspec adds `-ObjC` to consuming app
// targets for exactly this reason.
#define OPENCV_REGISTER_OP(IDENT, NAME, ...)                                    \
  @interface _OpenCVOpRegistrar_##IDENT : NSObject                             \
  @end                                                                          \
  @implementation _OpenCVOpRegistrar_##IDENT                                   \
  + (void)load {                                                                \
    [OpenCVOpRegistry registerOp:(NAME) handler:(__VA_ARGS__)];                 \
  }                                                                             \
  @end

// Analysis-op counterpart of OPENCV_REGISTER_OP. The handler block is taken as
// a variadic argument so its internal commas (e.g. in NSDictionary literals)
// are not mistaken for macro argument separators. `BLOCK` is an
// OpenCVDataHandler returning a JSON-serializable NSDictionary of results.
#define OPENCV_REGISTER_DATA_OP(IDENT, NAME, ...)                              \
  @interface _OpenCVDataOpRegistrar_##IDENT : NSObject                         \
  @end                                                                          \
  @implementation _OpenCVDataOpRegistrar_##IDENT                               \
  + (void)load {                                                                \
    [OpenCVOpRegistry registerDataOp:(NAME) handler:(__VA_ARGS__)];             \
  }                                                                             \
  @end

#endif
