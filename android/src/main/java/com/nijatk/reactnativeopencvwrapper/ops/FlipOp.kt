package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

object FlipOp : Op {
  override val name = "flip"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val code = when (params.getString("direction")) {
      "horizontal" -> 1
      "vertical" -> 0
      "both" -> -1
      else -> error("flip direction must be horizontal, vertical or both")
    }
    return Mat().also { Core.flip(current, it, code) }
  }
}
