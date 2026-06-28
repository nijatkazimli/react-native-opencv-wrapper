package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.imgproc.Imgproc

/** Shared helpers for the contour/shape analysis ops. */
internal object AnalysisSupport {
  /**
   * Resolve the points to analyse: explicit `points` from [params] if present,
   * otherwise the largest external contour of the binary [current] image.
   * Returns `null` when neither yields any points.
   */
  fun resolvePoints(current: Mat, params: JSONObject): MatOfPoint? {
    val explicit = params.optJSONArray("points")
    if (explicit != null && explicit.length() > 0) {
      val pts = ArrayList<Point>(explicit.length())
      for (i in 0 until explicit.length()) {
        val pair: JSONArray = explicit.getJSONArray(i)
        pts.add(Point(pair.getDouble(0), pair.getDouble(1)))
      }
      return MatOfPoint(*pts.toTypedArray())
    }
    val gray = OpSupport.ensureGray(current)
    val contours = ArrayList<MatOfPoint>()
    val hierarchy = Mat()
    try {
      Imgproc.findContours(gray, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
      val largest = contours.maxByOrNull { Imgproc.contourArea(it) } ?: return null
      return MatOfPoint(*largest.toArray())
    } finally {
      if (gray !== current) gray.release()
      hierarchy.release()
      contours.forEach { it.release() }
    }
  }
}
