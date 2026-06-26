package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc

/**
 * Linearly blend the current image with a second image:
 *   out = alpha * current + beta * source + gamma
 * `source` is a filesystem path or a (data-URI/raw) base64 string; it is
 * decoded and resized to match the current image before blending.
 */
object BlendOp : Op {
  override val name = "blend"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val source = params.optString("source", "")
    if (source.isEmpty()) invalidArg("blend 'source' must be a string path or base64 image")
    val alpha = if (params.has("alpha")) params.getDouble("alpha") else 0.5
    val beta = if (params.has("beta")) params.getDouble("beta") else 0.5
    val gamma = if (params.has("gamma")) params.getDouble("gamma") else 0.0

    val other = OpSupport.decodeImageArg(source, Imgcodecs.IMREAD_COLOR)
    try {
      if (other.size() != current.size()) {
        Imgproc.resize(other, other, current.size())
      }
      if (other.channels() != current.channels()) {
        val code = if (current.channels() == 1) Imgproc.COLOR_BGR2GRAY else Imgproc.COLOR_GRAY2BGR
        Imgproc.cvtColor(other, other, code)
      }
      return Mat().also { Core.addWeighted(current, alpha, other, beta, gamma, it) }
    } finally {
      other.release()
    }
  }
}
