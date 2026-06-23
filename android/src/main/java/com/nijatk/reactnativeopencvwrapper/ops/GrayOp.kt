package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat

object GrayOp : Op {
  override val name = "gray"
  override fun apply(current: Mat, params: JSONObject): Mat = OpSupport.ensureGray(current)
}
