package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat

/**
 * Per-pixel intensity remap (`Core.LUT`). `table` is a 256-entry lookup table
 * (built in JS from a function or array); the same table is applied to every
 * channel of the current image.
 */
object LutOp : Op {
  override val name = "lut"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val values = params.optJSONArray("table")
      ?: invalidArg("lut 'table' must be an array of 256 values")
    if (values.length() != 256) invalidArg("lut 'table' must be an array of 256 values")
    val bytes = ByteArray(256)
    for (i in 0 until 256) {
      bytes[i] = values.getInt(i).coerceIn(0, 255).toByte()
    }
    val table = Mat(1, 256, CvType.CV_8UC1)
    table.put(0, 0, bytes)
    return Mat().also {
      Core.LUT(current, table, it)
      table.release()
    }
  }
}
