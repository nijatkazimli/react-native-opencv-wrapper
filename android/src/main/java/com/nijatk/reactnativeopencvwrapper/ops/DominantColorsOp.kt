package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.TermCriteria
import org.opencv.imgproc.Imgproc

/**
 * Extract the `k` dominant colors with k-means and return each one as RGB + hex
 * with its pixel population and image fraction, ordered most-dominant first.
 * Unlike [KmeansOp] (which posterizes the image), this is a terminal analysis
 * step that returns the palette as data.
 */
object DominantColorsOp : DataOp {
  override val name = "dominantColors"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    var k = if (params.has("k")) params.getInt("k") else 5
    if (k < 1) invalidArg("dominantColors 'k' must be >= 1")
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
    try {
      val crit = TermCriteria(TermCriteria.EPS + TermCriteria.MAX_ITER, iterations, 1.0)
      Core.kmeans(reshaped, k, labels, crit, attempts, Core.KMEANS_PP_CENTERS, centers)

      val labelData = IntArray(sampleCount)
      labels.get(0, 0, labelData)
      val centerData = FloatArray(k * 3)
      centers.get(0, 0, centerData)

      val populations = IntArray(k)
      for (i in 0 until sampleCount) populations[labelData[i]]++

      val colors = ArrayList<JSONObject>(k)
      for (c in 0 until k) {
        // centers are BGR; expose RGB to JS.
        val b = Math.round(centerData[c * 3]).coerceIn(0, 255)
        val g = Math.round(centerData[c * 3 + 1]).coerceIn(0, 255)
        val r = Math.round(centerData[c * 3 + 2]).coerceIn(0, 255)
        colors.add(
          JSONObject()
            .put("color", JSONObject().put("r", r).put("g", g).put("b", b))
            .put("hex", String.format("#%02X%02X%02X", r, g, b))
            .put("population", populations[c])
            .put("fraction", populations[c].toDouble() / sampleCount),
        )
      }
      colors.sortByDescending { it.getInt("population") }

      val out = JSONArray()
      colors.forEach { out.put(it) }
      return JSONObject()
        .put("colors", out)
        .put("count", out.length())
        .put("width", current.cols())
        .put("height", current.rows())
    } finally {
      if (img !== current) img.release()
      data.release()
      reshaped.release()
      labels.release()
      centers.release()
    }
  }
}
