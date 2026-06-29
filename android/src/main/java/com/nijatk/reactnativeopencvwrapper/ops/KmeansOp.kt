package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.TermCriteria
import org.opencv.imgproc.Imgproc

/** k-means color quantization: map every pixel to the nearest of `k` colors. */
object KmeansOp : Op {
  override val name = "kmeans"

  override fun apply(current: Mat, params: JSONObject): Mat {
    var k = if (params.has("k")) params.getInt("k") else 8
    if (k < 1) invalidArg("kmeans 'k' must be >= 1")
    var attempts = if (params.has("attempts")) params.getInt("attempts") else 3
    if (attempts < 1) attempts = 1
    var iterations = if (params.has("iterations")) params.getInt("iterations") else 10
    if (iterations < 1) iterations = 1

    val img = if (current.channels() == 1) {
      Mat().also { Imgproc.cvtColor(current, it, Imgproc.COLOR_GRAY2BGR) }
    } else {
      current
    }
    val sampleCount = img.rows() * img.cols()
    if (k > sampleCount) k = sampleCount

    val data = Mat()
    img.convertTo(data, CvType.CV_32F)
    val reshaped = data.reshape(1, sampleCount)
    val labels = Mat()
    val centers = Mat()
    val crit = TermCriteria(TermCriteria.EPS + TermCriteria.MAX_ITER, iterations, 1.0)
    Core.kmeans(reshaped, k, labels, crit, attempts, Core.KMEANS_PP_CENTERS, centers)

    val labelData = IntArray(sampleCount)
    labels.get(0, 0, labelData)
    val centerData = FloatArray(k * 3)
    centers.get(0, 0, centerData)
    val outData = ByteArray(sampleCount * 3)
    for (i in 0 until sampleCount) {
      val c = labelData[i]
      outData[i * 3] = centerData[c * 3].toInt().coerceIn(0, 255).toByte()
      outData[i * 3 + 1] = centerData[c * 3 + 1].toInt().coerceIn(0, 255).toByte()
      outData[i * 3 + 2] = centerData[c * 3 + 2].toInt().coerceIn(0, 255).toByte()
    }
    val flat = Mat(sampleCount, 3, CvType.CV_8U)
    flat.put(0, 0, outData)
    val out = flat.reshape(3, img.rows()).clone()

    if (img !== current) img.release()
    data.release()
    reshaped.release()
    labels.release()
    centers.release()
    flat.release()
    return out
  }
}
