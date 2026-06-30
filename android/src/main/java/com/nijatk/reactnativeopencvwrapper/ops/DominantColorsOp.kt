package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat

/**
 * Extract the `k` dominant colors with k-means and return each one as RGB + hex
 * with its pixel population and image fraction, ordered most-dominant first.
 * Unlike [KmeansOp] (which posterizes the image), this is a terminal analysis
 * step that returns the palette as data.
 */
object DominantColorsOp : DataOp {
  override val name = "dominantColors"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val km = OpSupport.runKmeansBgr(current, params, 5, "dominantColors")

    val populations = IntArray(km.k)
    for (i in 0 until km.sampleCount) populations[km.labels[i]]++

    val colors = ArrayList<JSONObject>(km.k)
    for (c in 0 until km.k) {
      // centers are BGR; expose RGB to JS.
      val b = Math.round(km.centers[c * 3]).coerceIn(0, 255)
      val g = Math.round(km.centers[c * 3 + 1]).coerceIn(0, 255)
      val r = Math.round(km.centers[c * 3 + 2]).coerceIn(0, 255)
      colors.add(
        JSONObject()
          .put("color", JSONObject().put("r", r).put("g", g).put("b", b))
          .put("hex", String.format("#%02X%02X%02X", r, g, b))
          .put("population", populations[c])
          .put("fraction", populations[c].toDouble() / km.sampleCount),
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
  }
}
