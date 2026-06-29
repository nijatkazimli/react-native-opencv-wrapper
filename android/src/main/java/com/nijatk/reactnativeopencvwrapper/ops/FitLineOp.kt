package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Best-fit line (L2) through explicit `points`, or through the largest contour
 * when none are given (`fitLine`).
 */
object FitLineOp : DataOp {
  override val name = "fitLine"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    val found = pts != null
    var line: JSONObject? = null
    if (pts != null) {
      val c2f = MatOfPoint2f(*pts.toArray())
      val out = Mat()
      Imgproc.fitLine(c2f, out, Imgproc.DIST_L2, 0.0, 0.01, 0.01)
      line = JSONObject()
        .put("vx", out.get(0, 0)[0])
        .put("vy", out.get(1, 0)[0])
        .put("x0", out.get(2, 0)[0])
        .put("y0", out.get(3, 0)[0])
      out.release()
      c2f.release()
      pts.release()
    }
    return JSONObject()
      .put("found", found)
      .put("line", line ?: JSONObject.NULL)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
