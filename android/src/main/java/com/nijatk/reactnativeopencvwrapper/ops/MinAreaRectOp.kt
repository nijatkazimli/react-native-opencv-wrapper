package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Rotated minimum-area rectangle of explicit `points`, or of the largest
 * contour of the binary image when none are given (`minAreaRect`).
 */
object MinAreaRectOp : DataOp {
  override val name = "minAreaRect"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    var rect: JSONObject? = null
    if (pts != null) {
      val c2f = MatOfPoint2f(*pts.toArray())
      val rr = Imgproc.minAreaRect(c2f)
      rect = JSONObject()
        .put("centerX", rr.center.x).put("centerY", rr.center.y)
        .put("width", rr.size.width).put("height", rr.size.height)
        .put("angle", rr.angle)
      c2f.release()
      pts.release()
    }
    return JSONObject()
      .put("found", rect != null)
      .put("minAreaRect", rect ?: JSONObject.NULL)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
