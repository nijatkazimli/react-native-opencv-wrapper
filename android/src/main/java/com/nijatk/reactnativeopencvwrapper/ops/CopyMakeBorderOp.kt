package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Scalar

/**
 * Pad an image with the given top/bottom/left/right margins. `borderType`
 * selects how the border pixels are produced; `color` applies only to the
 * "constant" border type.
 */
object CopyMakeBorderOp : Op {
  override val name = "copyMakeBorder"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val top = params.getInt("top")
    val bottom = params.getInt("bottom")
    val left = params.getInt("left")
    val right = params.getInt("right")
    if (top < 0 || bottom < 0 || left < 0 || right < 0) {
      invalidArg("copyMakeBorder margins must be >= 0")
    }
    val border = borderFlag(params.optString("borderType"))
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 0.0))
    return Mat().also {
      Core.copyMakeBorder(current, it, top, bottom, left, right, border, color)
    }
  }

  private fun borderFlag(name: String?): Int = when (name) {
    null, "", "constant" -> Core.BORDER_CONSTANT
    "replicate" -> Core.BORDER_REPLICATE
    "reflect" -> Core.BORDER_REFLECT
    "reflect101" -> Core.BORDER_REFLECT_101
    "wrap" -> Core.BORDER_WRAP
    else -> invalidArg("borderType must be constant, replicate, reflect, reflect101 or wrap")
  }
}
