package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Simplify a polygon (explicit `points` or the largest contour) to its corner
 * vertices with Ramer–Douglas–Peucker (`approxPolyDP`). `epsilon` is a fraction
 * of the perimeter.
 */
object ApproxPolyDPOp : DataOp {
  override val name = "approxPolyDP"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val epsilon = params.optDouble("epsilon", 0.02)
    val closed = params.optBoolean("closed", true)
    val pts = AnalysisSupport.resolvePoints(current, params)
    val points = JSONArray()
    val found = pts != null
    if (pts != null) {
      val c2f = MatOfPoint2f(*pts.toArray())
      val approx = MatOfPoint2f()
      val peri = Imgproc.arcLength(c2f, closed)
      Imgproc.approxPolyDP(c2f, approx, epsilon * peri, closed)
      for (p in approx.toArray()) {
        points.put(JSONObject().put("x", p.x).put("y", p.y))
      }
      c2f.release()
      approx.release()
      pts.release()
    }
    return JSONObject()
      .put("found", found)
      .put("points", points)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
