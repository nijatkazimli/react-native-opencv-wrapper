package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Laplacian (`Imgproc.Laplacian`) — isotropic second-derivative edge detector.
 * Computed at signed precision then returned as an absolute 8-bit image.
 */
object LaplacianOp : Op {
  override val name = "laplacian"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val ksize = if (params.has("ksize")) params.getInt("ksize") else 1
    val scale = if (params.has("scale")) params.getDouble("scale") else 1.0
    val delta = if (params.has("delta")) params.getDouble("delta") else 0.0
    if (ksize < 1 || ksize % 2 == 0 || ksize > 7) {
      invalidArg("laplacian ksize must be 1, 3, 5 or 7")
    }
    val signedResponse = Mat()
    Imgproc.Laplacian(current, signedResponse, CvType.CV_16S, ksize, scale, delta)
    return Mat().also {
      Core.convertScaleAbs(signedResponse, it)
      signedResponse.release()
    }
  }
}
