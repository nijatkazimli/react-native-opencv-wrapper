package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

object RotateOp : Op {
  override val name = "rotate"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val code = when (params.getInt("angle")) {
      90 -> Core.ROTATE_90_CLOCKWISE
      180 -> Core.ROTATE_180
      270 -> Core.ROTATE_90_COUNTERCLOCKWISE
      else -> error("rotate angle must be 90, 180 or 270")
    }
    return Mat().also { Core.rotate(current, it, code) }
  }
}
