package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Rect

object CropOp : Op {
  override val name = "crop"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val x = params.getInt("x")
    val y = params.getInt("y")
    val w = params.getInt("width")
    val h = params.getInt("height")
    require(
      x >= 0 && y >= 0 && w >= 1 && h >= 1 &&
        x + w <= current.cols() && y + h <= current.rows()
    ) { "crop rectangle is out of image bounds" }
    // submat is a view; clone so the result owns its own data.
    return Mat(current, Rect(x, y, w, h)).clone()
  }
}
