package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
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
  ).associateBy { it.name }

  /** Run all serialized ops in `opsJson`, reading once and writing once. */
  fun execute(inputPath: String, outputPath: String, opsJson: String) {
    val steps = JSONArray(opsJson)
    var current = OpSupport.readOrThrow(inputPath, Imgcodecs.IMREAD_COLOR)
    try {
      for (i in 0 until steps.length()) {
        val op = steps.getJSONObject(i)
        val type = op.getString("type")
        val handler = ops[type] ?: error("Unknown pipeline op type '$type'")
        val next = handler.apply(current, op)
        if (next !== current) current.release()
        current = next
      }
      OpSupport.writeOrThrow(outputPath, current)
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
}
