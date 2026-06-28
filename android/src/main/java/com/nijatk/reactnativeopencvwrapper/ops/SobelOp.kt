package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Sobel derivative (`Imgproc.Sobel`). Computed at signed 16-bit precision then
 * converted to an absolute 8-bit image so the result stays displayable.
 */
object SobelOp : Op {
  override val name = "sobel"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val dx = params.getInt("dx")
    val dy = params.getInt("dy")
    val ksize = if (params.has("ksize")) params.getInt("ksize") else 3
    val scale = if (params.has("scale")) params.getDouble("scale") else 1.0
    val delta = if (params.has("delta")) params.getDouble("delta") else 0.0
    if (dx < 0 || dy < 0 || dx + dy < 1) {
      invalidArg("sobel dx and dy must be >= 0 with dx + dy >= 1")
    }
    if (ksize < 1 || ksize % 2 == 0 || ksize > 7) {
      invalidArg("sobel ksize must be 1, 3, 5 or 7")
    }
    val signedGradient = Mat()
    Imgproc.Sobel(current, signedGradient, CvType.CV_16S, dx, dy, ksize, scale, delta)
    return Mat().also {
      Core.convertScaleAbs(signedGradient, it)
      signedGradient.release()
    }
  }
}
