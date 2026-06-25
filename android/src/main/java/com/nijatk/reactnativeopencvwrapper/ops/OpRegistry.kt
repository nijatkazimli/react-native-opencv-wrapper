package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgcodecs.Imgcodecs

/**
 * Orchestrator for the native pipeline. It reads the input once, applies every
 * queued op in memory, and writes the result once.
 *
 * The [ops] list is the single place that grows when an operation is added —
 * create a new `*Op` object in this package and add one entry below; this
 * `execute` logic never changes.
 */
object OpRegistry {

  private val ops: Map<String, Op> = listOf(
    GrayOp,
    GaussianBlurOp,
    CannyOp,
    ResizeOp,
    CropOp,
    RotateOp,
    FlipOp,
    ThresholdOp,
    MedianBlurOp,
    DilateOp,
    ErodeOp,
    CvtColorOp,
    InRangeOp,
    Filter2DOp,
    AdaptiveThresholdOp,
    MorphologyExOp,
    BitwiseNotOp,
    ApplyMaskOp,
    DebugOp,
    ScanDocumentOp,
  ).associateBy { it.name }

  private val dataOps: Map<String, DataOp> = listOf(
    DecodeQROp,
    DetectDocumentOp,
  ).associateBy { it.name }

  /** Run all serialized ops in `opsJson`, reading once and writing once. */
  fun execute(inputPath: String, outputPath: String, opsJson: String) {
    val source = OpSupport.readOrThrow(inputPath, Imgcodecs.IMREAD_COLOR)
    val result = applyOps(opsJson, source)
    try {
      OpSupport.writeOrThrow(outputPath, result)
    } finally {
      result.release()
    }
  }

  /**
   * In-memory variant. `inputJson` / `outputJson` are JSON source/sink
   * descriptors (`{"kind":"path"|"base64",...}`). Returns the output path or
   * the encoded base64 string.
   */
  fun executeIO(inputJson: String, outputJson: String, opsJson: String): String {
    val input = JSONObject(inputJson)
    val output = JSONObject(outputJson)
    val source = decodeInput(input)
    val result = applyOps(opsJson, source)
    try {
      return encodeOutput(output, result)
    } finally {
      result.release()
    }
  }

  /**
   * Data-returning variant. `inputJson` is a JSON source descriptor. Decodes
   * the source once, applies every op in `opsJson` except the last as
   * transforms, then runs the final op as a registered analysis op. Returns the
   * analysis result encoded as a JSON string.
   */
  fun executeData(inputJson: String, opsJson: String): String {
    val steps = JSONArray(opsJson)
    if (steps.length() == 0) {
      throw OpenCVInvalidArgumentException("Pipeline has no analysis op")
    }

    val lastIndex = steps.length() - 1
    val dataOpJson = steps.getJSONObject(lastIndex)
    val type = dataOpJson.getString("type")
    val handler = dataOps[type]
      ?: throw OpenCVUnknownOpException("Unknown analysis op type '$type'")

    val transforms = JSONArray()
    for (i in 0 until lastIndex) transforms.put(steps.getJSONObject(i))

    val source = decodeInput(JSONObject(inputJson))
    val current = applyOps(transforms.toString(), source)
    try {
      return handler.analyze(current, dataOpJson).toString()
    } finally {
      current.release()
    }
  }

  /** Run a single op through the same pipeline path used by execute. */
  fun executeSingle(
    inputPath: String,
    outputPath: String,
    opName: String,
    params: JSONObject = JSONObject(),
  ) {
    val op = JSONObject(params.toString())
    op.put("type", opName)
    execute(inputPath, outputPath, JSONArray().put(op).toString())
  }

  /**
   * Run `opsJson` on a copy of `current`, returning the resulting [Mat]. Used
   * by composite ops (e.g. [ApplyMaskOp]) to evaluate a sub-pipeline without
   * disturbing the caller's Mat. The caller owns and must release the result.
   */
  fun runSubPipeline(current: Mat, opsJson: String): Mat =
    applyOps(opsJson, current.clone())

  /**
   * Apply every op in `opsJson` to `source`, releasing intermediates. Takes
   * ownership of `source` and returns the final [Mat] (the caller releases it).
   */
  private fun applyOps(opsJson: String, source: Mat): Mat {
    val steps = JSONArray(opsJson)
    var current = source
    try {
      for (i in 0 until steps.length()) {
        val op = steps.getJSONObject(i)
        val type = op.getString("type")
        val handler = ops[type] ?: throw OpenCVUnknownOpException("Unknown pipeline op type '$type'")
        val next = handler.apply(current, op)
        if (next !== current) current.release()
        current = next
      }
    } catch (t: Throwable) {
      current.release()
      throw t
    }
    return current
  }

  private fun decodeInput(input: JSONObject): Mat = when (val kind = input.getString("kind")) {
    "path" -> OpSupport.readOrThrow(input.getString("value"), Imgcodecs.IMREAD_COLOR)
    "base64" -> OpSupport.decodeBase64OrThrow(input.getString("value"), Imgcodecs.IMREAD_COLOR)
    else -> throw OpenCVInvalidArgumentException("input descriptor has an unknown 'kind': $kind")
  }

  private fun encodeOutput(output: JSONObject, mat: Mat): String =
    when (val kind = output.getString("kind")) {
      "path" -> output.getString("value").also { OpSupport.writeOrThrow(it, mat) }
      "base64" -> OpSupport.encodeBase64OrThrow(mat, output.optString("ext", ".png"))
      else -> throw OpenCVInvalidArgumentException("output descriptor has an unknown 'kind': $kind")
    }
}
