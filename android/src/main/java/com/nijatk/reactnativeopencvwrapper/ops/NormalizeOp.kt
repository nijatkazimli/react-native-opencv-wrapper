package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat

/**
 * Rescale pixel intensities. For "minmax" the values are stretched into the
 * [alpha, beta] range; for "l1"/"l2"/"inf" the chosen norm of the array is
 * scaled to `alpha` (and `beta` is ignored).
 */
object NormalizeOp : Op {
  override val name = "normalize"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val alpha = if (params.has("alpha")) params.getDouble("alpha") else 0.0
    val beta = if (params.has("beta")) params.getDouble("beta") else 255.0
    val norm = normFlag(params.optString("normType"))
    // NORM_MINMAX is undefined for multi-channel arrays, so stretch each
    // channel independently.
    if (norm == Core.NORM_MINMAX && current.channels() > 1) {
      val channels = ArrayList<Mat>()
      Core.split(current, channels)
      for (channel in channels) Core.normalize(channel, channel, alpha, beta, norm)
      val dst = Mat()
      Core.merge(channels, dst)
      channels.forEach { it.release() }
      return dst
    }
    return Mat().also { Core.normalize(current, it, alpha, beta, norm) }
  }

  private fun normFlag(name: String?): Int = when (name) {
    null, "", "minmax" -> Core.NORM_MINMAX
    "l1" -> Core.NORM_L1
    "l2" -> Core.NORM_L2
    "inf" -> Core.NORM_INF
    else -> invalidArg("normType must be minmax, l1, l2 or inf")
  }
}
