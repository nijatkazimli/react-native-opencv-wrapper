package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Detect circles via the Hough gradient method (`HoughCircles`). Operates on
 * grayscale; the image is converted automatically. A prior gaussianBlur()
 * reduces false positives.
 */
object HoughCirclesOp : DataOp {
  override val name = "houghCircles"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val dp = params.optDouble("dp", 1.0)
    val minDist = params.optDouble("minDist", 20.0)
    val param1 = params.optDouble("param1", 100.0)
    val param2 = params.optDouble("param2", 30.0)
    val minRadius = if (params.has("minRadius")) params.getInt("minRadius") else 0
    val maxRadius = if (params.has("maxRadius")) params.getInt("maxRadius") else 0
    if (dp <= 0 || minDist <= 0 || param1 <= 0 || param2 <= 0) {
      invalidArg("houghCircles dp, minDist, param1 and param2 must be positive")
    }

    val gray = OpSupport.ensureGray(current)
    val found = Mat()
    val circles = JSONArray()
    try {
      Imgproc.HoughCircles(
        gray, found, Imgproc.HOUGH_GRADIENT, dp, minDist, param1, param2, minRadius, maxRadius,
      )
      for (i in 0 until found.cols()) {
        val c = found.get(0, i)
        circles.put(JSONObject().put("x", c[0]).put("y", c[1]).put("radius", c[2]))
      }
    } finally {
      if (gray !== current) gray.release()
      found.release()
    }

    return JSONObject()
      .put("found", circles.length() > 0)
      .put("count", circles.length())
      .put("circles", circles)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
