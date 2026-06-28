package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Axis-aligned bounding box of explicit `points`, or of the largest contour of
 * the binary image when none are given (`boundingRect`).
 */
object BoundingRectOp : DataOp {
  override val name = "boundingRect"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    var box: JSONObject? = null
    if (pts != null) {
      val r = Imgproc.boundingRect(pts)
      box = JSONObject().put("x", r.x).put("y", r.y).put("width", r.width).put("height", r.height)
      pts.release()
    }
    return JSONObject()
      .put("found", box != null)
      .put("boundingBox", box ?: JSONObject.NULL)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
