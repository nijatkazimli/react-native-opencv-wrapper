package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.imgproc.Imgproc

/**
 * Find contours and return per-contour shape metrics. The image is treated as a
 * binary mask (non-zero = foreground), so chain `gray()` then
 * `threshold()`/`canny()` first for clean shapes. Produces:
 * `{ "found": Boolean, "count": Int, "contours": [...], "width": Int, "height": Int }`
 * where each contour is `{ "area", "points": [{ "x", "y" }...], "boundingBox":
 * {...}, "minAreaRect": {...} }`, ordered largest-area first.
 */
object FindContoursOp : DataOp {
  override val name = "findContours"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val mode = params.optString("mode", "external")
    val minArea = params.optDouble("minArea", 0.0)
    val epsilon = params.optDouble("epsilon", 0.0)
    val retr = if (mode == "list") Imgproc.RETR_LIST else Imgproc.RETR_EXTERNAL

    val gray = OpSupport.ensureGray(current)
    val contours = ArrayList<MatOfPoint>()
    val hierarchy = Mat()
    val out = JSONArray()
    try {
      Imgproc.findContours(gray, contours, hierarchy, retr, Imgproc.CHAIN_APPROX_SIMPLE)
      contours.sortByDescending { Imgproc.contourArea(it) }
      for (contour in contours) {
        val area = Imgproc.contourArea(contour)
        if (area < minArea) continue

        var pts = contour.toArray()
        if (epsilon > 0.0) {
          val c2f = MatOfPoint2f(*pts)
          val approx = MatOfPoint2f()
          try {
            val peri = Imgproc.arcLength(c2f, true)
            Imgproc.approxPolyDP(c2f, approx, epsilon * peri, true)
            pts = approx.toArray()
          } finally {
            c2f.release()
            approx.release()
          }
        }

        val points = JSONArray()
        for (p in pts) {
          points.put(JSONObject().put("x", p.x).put("y", p.y))
        }
        val box = Imgproc.boundingRect(contour)
        val rr = Imgproc.minAreaRect(MatOfPoint2f(*contour.toArray()))
        out.put(
          JSONObject()
            .put("area", area)
            .put("points", points)
            .put(
              "boundingBox",
              JSONObject().put("x", box.x).put("y", box.y)
                .put("width", box.width).put("height", box.height),
            )
            .put(
              "minAreaRect",
              JSONObject().put("centerX", rr.center.x).put("centerY", rr.center.y)
                .put("width", rr.size.width).put("height", rr.size.height)
                .put("angle", rr.angle),
            ),
        )
      }
    } finally {
      if (gray !== current) gray.release()
      hierarchy.release()
      contours.forEach { it.release() }
    }

    return JSONObject()
      .put("found", out.length() > 0)
      .put("count", out.length())
      .put("contours", out)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
