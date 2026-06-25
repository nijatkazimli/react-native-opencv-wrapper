package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object CvtColorOp : Op {
  override val name = "cvtColor"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val code = colorCode(params.optString("code"))
    return Mat().also { Imgproc.cvtColor(current, it, code) }
  }

  private fun colorCode(name: String?): Int = when (name) {
    "BGR2GRAY" -> Imgproc.COLOR_BGR2GRAY
    "GRAY2BGR" -> Imgproc.COLOR_GRAY2BGR
    "BGR2RGB" -> Imgproc.COLOR_BGR2RGB
    "RGB2BGR" -> Imgproc.COLOR_RGB2BGR
    "BGR2HSV" -> Imgproc.COLOR_BGR2HSV
    "HSV2BGR" -> Imgproc.COLOR_HSV2BGR
    "BGR2HLS" -> Imgproc.COLOR_BGR2HLS
    "HLS2BGR" -> Imgproc.COLOR_HLS2BGR
    "BGR2Lab" -> Imgproc.COLOR_BGR2Lab
    "Lab2BGR" -> Imgproc.COLOR_Lab2BGR
    "BGR2YCrCb" -> Imgproc.COLOR_BGR2YCrCb
    "YCrCb2BGR" -> Imgproc.COLOR_YCrCb2BGR
    else -> invalidArg("cvtColor 'code' is not a supported conversion")
  }
}
