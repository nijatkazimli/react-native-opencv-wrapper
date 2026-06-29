package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

/** Count non-zero pixels of the (grayscale) image (`countNonZero`). */
object CountNonZeroOp : DataOp {
  override val name = "countNonZero"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val gray = OpSupport.ensureGray(current)
    val count = Core.countNonZero(gray)
    if (gray !== current) gray.release()
    val total = current.cols() * current.rows()
    val ratio = if (total > 0) count.toDouble() / total else 0.0
    return JSONObject()
      .put("count", count)
      .put("total", total)
      .put("ratio", ratio)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
