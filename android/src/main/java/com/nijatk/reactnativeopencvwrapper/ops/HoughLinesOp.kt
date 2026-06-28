package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Detect line segments via the probabilistic Hough transform (`HoughLinesP`).
 * Input should be edges (chain gray() + canny()); other images are reduced to
 * gray first.
 */
object HoughLinesOp : DataOp {
  override val name = "houghLines"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val rho = params.optDouble("rho", 1.0)
    val theta = params.optDouble("theta", Math.PI / 180.0)
    val threshold = if (params.has("threshold")) params.getInt("threshold") else 80
    val minLineLength = params.optDouble("minLineLength", 30.0)
    val maxLineGap = params.optDouble("maxLineGap", 10.0)
    if (rho <= 0 || theta <= 0 || threshold <= 0) {
      invalidArg("houghLines rho, theta and threshold must be positive")
    }

    val gray = OpSupport.ensureGray(current)
    val segments = Mat()
    val lines = JSONArray()
    try {
      Imgproc.HoughLinesP(gray, segments, rho, theta, threshold, minLineLength, maxLineGap)
      for (i in 0 until segments.rows()) {
        val s = segments.get(i, 0)
        lines.put(JSONObject().put("x1", s[0]).put("y1", s[1]).put("x2", s[2]).put("y2", s[3]))
      }
    } finally {
      if (gray !== current) gray.release()
      segments.release()
    }

    return JSONObject()
      .put("found", lines.length() > 0)
      .put("count", lines.length())
      .put("lines", lines)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
