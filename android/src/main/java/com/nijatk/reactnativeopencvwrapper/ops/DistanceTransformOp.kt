package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Distance transform of a binarized (Otsu) grayscale image; each foreground
 * pixel becomes its distance to the nearest zero pixel (`distanceTransform`).
 */
object DistanceTransformOp : Op {
  override val name = "distanceTransform"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val distType = when (params.optString("distanceType", "L2")) {
      "L1" -> Imgproc.DIST_L1
      "C" -> Imgproc.DIST_C
      else -> Imgproc.DIST_L2
    }
    var maskSize = if (params.has("maskSize")) params.getInt("maskSize") else 3
    if (maskSize != 0 && maskSize != 3 && maskSize != 5) maskSize = 3
    val normalize = if (params.has("normalize")) params.getBoolean("normalize") else true

    val gray = OpSupport.ensureGray(current)
    val bin = Mat()
    Imgproc.threshold(gray, bin, 0.0, 255.0, Imgproc.THRESH_BINARY or Imgproc.THRESH_OTSU)
    val dist = Mat()
    Imgproc.distanceTransform(bin, dist, distType, maskSize)
    if (normalize) Core.normalize(dist, dist, 0.0, 255.0, Core.NORM_MINMAX)
    val out = Mat()
    dist.convertTo(out, CvType.CV_8U)

    if (gray !== current) gray.release()
    bin.release()
    dist.release()
    return out
  }
}
