package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfInt
import org.opencv.imgproc.Imgproc

/**
 * Convex hull of explicit `points`, or of the largest contour of the binary
 * image when none are given (`convexHull`).
 */
object ConvexHullOp : DataOp {
  override val name = "convexHull"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    val found = pts != null
    val hull = JSONArray()
    if (pts != null) {
      val indices = MatOfInt()
      Imgproc.convexHull(pts, indices)
      val points = pts.toArray()
      for (i in indices.toArray()) {
        val p = points[i]
        hull.put(JSONObject().put("x", p.x.toInt()).put("y", p.y.toInt()))
      }
      indices.release()
      pts.release()
    }
    return JSONObject()
      .put("found", found)
      .put("hull", hull)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
