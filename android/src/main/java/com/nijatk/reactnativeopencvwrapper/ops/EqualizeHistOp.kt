package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Global histogram equalization. The image is grayscaled first, so the result
 * is single-channel.
 */
object EqualizeHistOp : Op {
  override val name = "equalizeHist"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val gray = OpSupport.ensureGray(current)
    val dst = Mat()
    Imgproc.equalizeHist(gray, dst)
    if (gray !== current) gray.release()
    return dst
  }
}
