package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Scalar

object InRangeOp : Op {
  override val name = "inRange"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val lower = bound(params, "lower")
    val upper = bound(params, "upper")
    if (lower.size != upper.size) {
      invalidArg("inRange 'lower' and 'upper' must have the same length")
    }
    if (current.channels() != lower.size) {
      invalidArg(
        "inRange bounds have ${lower.size} components but the image has " +
          "${current.channels()} channel(s)",
      )
    }
    return Mat().also { Core.inRange(current, scalar(lower), scalar(upper), it) }
  }

  private fun bound(params: JSONObject, key: String): DoubleArray {
    val array = params.optJSONArray(key)
      ?: invalidArg("inRange '$key' must be an array of numbers")
    if (array.length() < 1 || array.length() > 4) {
      invalidArg("inRange '$key' must have 1 to 4 components")
    }
    return DoubleArray(array.length()) { array.getDouble(it) }
  }

  private fun scalar(values: DoubleArray): Scalar {
    val padded = DoubleArray(4)
    values.copyInto(padded)
    return Scalar(padded)
  }
}
