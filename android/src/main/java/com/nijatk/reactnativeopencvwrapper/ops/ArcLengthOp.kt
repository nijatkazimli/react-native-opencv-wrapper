package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Perimeter (closed) or curve length (open) of explicit `points`, or of the
 * largest contour of the binary image when none are given (`arcLength`).
 */
object ArcLengthOp : DataOp {
  override val name = "arcLength"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val closed = params.optBoolean("closed", true)
    val pts = AnalysisSupport.resolvePoints(current, params)
    val found = pts != null
    var length = 0.0
    if (pts != null) {
      val c2f = MatOfPoint2f(*pts.toArray())
      length = Imgproc.arcLength(c2f, closed)
      c2f.release()
      pts.release()
    }
    return JSONObject()
      .put("found", found)
      .put("length", length)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
