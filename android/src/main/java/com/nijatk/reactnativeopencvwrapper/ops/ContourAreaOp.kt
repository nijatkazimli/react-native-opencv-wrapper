package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Enclosed area of explicit `points`, or of the largest contour of the binary
 * image when none are given (`contourArea`).
 */
object ContourAreaOp : DataOp {
  override val name = "contourArea"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val pts = AnalysisSupport.resolvePoints(current, params)
    val found = pts != null
    var area = 0.0
    if (pts != null) {
      area = Imgproc.contourArea(pts)
      pts.release()
    }
    return JSONObject()
      .put("found", found)
      .put("area", area)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
