package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

/** Minimum/maximum intensity and their locations (single-channel; `minMaxLoc`). */
object MinMaxLocOp : DataOp {
  override val name = "minMaxLoc"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val gray = OpSupport.ensureGray(current)
    val mm = Core.minMaxLoc(gray)
    if (gray !== current) gray.release()
    return JSONObject()
      .put("min", mm.minVal)
      .put("max", mm.maxVal)
      .put("minLoc", JSONObject().put("x", mm.minLoc.x.toInt()).put("y", mm.minLoc.y.toInt()))
      .put("maxLoc", JSONObject().put("x", mm.maxLoc.x.toInt()).put("y", mm.maxLoc.y.toInt()))
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
