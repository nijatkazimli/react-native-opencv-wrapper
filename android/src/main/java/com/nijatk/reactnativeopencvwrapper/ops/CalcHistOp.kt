package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfFloat
import org.opencv.core.MatOfInt
import org.opencv.imgproc.Imgproc

/** Intensity histogram of one channel over [0, 256), quantized into `bins`. */
object CalcHistOp : DataOp {
  override val name = "calcHist"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val bins = (if (params.has("bins")) params.getInt("bins") else 256).coerceIn(1, 256)
    var channel = if (params.has("channel")) params.getInt("channel") else 0
    if (channel < 0 || channel >= current.channels()) channel = 0

    val hist = Mat()
    Imgproc.calcHist(
      listOf(current),
      MatOfInt(channel),
      Mat(),
      hist,
      MatOfInt(bins),
      MatOfFloat(0f, 256f),
    )
    val histogram = JSONArray()
    for (i in 0 until bins) {
      histogram.put(hist.get(i, 0)[0].toLong())
    }
    hist.release()
    return JSONObject()
      .put("bins", bins)
      .put("channel", channel)
      .put("histogram", histogram)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
