package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * Detect external contours of the (binary) image and draw them onto a color
 * copy — a quick visualization of what findContours found (`drawContours`).
 */
object DrawContoursOp : Op {
  override val name = "drawContours"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 255.0, 0.0))
    val thickness = if (params.has("thickness")) params.getInt("thickness") else 2
    val minArea = if (params.has("minArea")) params.getDouble("minArea") else 0.0
    val lineType = OpSupport.lineType(params)

    val gray = OpSupport.ensureGray(current)
    val contours = ArrayList<MatOfPoint>()
    val hierarchy = Mat()
    Imgproc.findContours(
      gray, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE,
    )

    val out = if (current.channels() == 1) {
      Mat().also { Imgproc.cvtColor(current, it, Imgproc.COLOR_GRAY2BGR) }
    } else {
      current.clone()
    }
    for (i in contours.indices) {
      if (Imgproc.contourArea(contours[i]) < minArea) continue
      Imgproc.drawContours(out, contours, i, color, thickness, lineType)
    }

    if (gray !== current) gray.release()
    hierarchy.release()
    contours.forEach { it.release() }
    return out
  }
}
