package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Best-fit ellipse (as its bounding rotated rect) of explicit `points`, or of
 * the largest contour when none are given (`fitEllipse`). Requires >= 5 points.
 */
object FitEllipseOp : DataOp {
  override val name = "fitEllipse"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    val ok = pts != null && pts.toArray().size >= 5
    var ellipse: JSONObject? = null
    if (ok) {
      val c2f = MatOfPoint2f(*pts!!.toArray())
      val rr = Imgproc.fitEllipse(c2f)
      ellipse = JSONObject()
        .put("centerX", rr.center.x).put("centerY", rr.center.y)
        .put("width", rr.size.width).put("height", rr.size.height)
        .put("angle", rr.angle)
      c2f.release()
    }
    pts?.release()
    return JSONObject()
      .put("found", ok)
      .put("ellipse", ellipse ?: JSONObject.NULL)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
