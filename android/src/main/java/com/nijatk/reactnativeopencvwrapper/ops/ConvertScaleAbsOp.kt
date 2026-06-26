package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

/**
 * Brightness/contrast adjustment: out = saturate(|alpha * current + beta|).
 * The result is always an 8-bit image.
 */
object ConvertScaleAbsOp : Op {
  override val name = "convertScaleAbs"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val alpha = if (params.has("alpha")) params.getDouble("alpha") else 1.0
    val beta = if (params.has("beta")) params.getDouble("beta") else 0.0
    return Mat().also { Core.convertScaleAbs(current, it, alpha, beta) }
  }
}
