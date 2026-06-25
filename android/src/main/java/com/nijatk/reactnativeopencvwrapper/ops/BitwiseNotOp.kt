package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

object BitwiseNotOp : Op {
  override val name = "bitwiseNot"
  override fun apply(current: Mat, params: JSONObject): Mat =
    Mat().also { Core.bitwise_not(current, it) }
}
