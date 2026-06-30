package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.CvType
import org.opencv.core.Mat

/** k-means color quantization: map every pixel to the nearest of `k` colors. */
object KmeansOp : Op {
  override val name = "kmeans"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val km = OpSupport.runKmeansBgr(current, params, 8, "kmeans")
    val outData = ByteArray(km.sampleCount * 3)
    for (i in 0 until km.sampleCount) {
      val c = km.labels[i]
      outData[i * 3] = km.centers[c * 3].toInt().coerceIn(0, 255).toByte()
      outData[i * 3 + 1] = km.centers[c * 3 + 1].toInt().coerceIn(0, 255).toByte()
      outData[i * 3 + 2] = km.centers[c * 3 + 2].toInt().coerceIn(0, 255).toByte()
    }
    val flat = Mat(km.sampleCount, 3, CvType.CV_8U)
    flat.put(0, 0, outData)
    val out = flat.reshape(3, current.rows()).clone()
    flat.release()
    return out
  }
}
