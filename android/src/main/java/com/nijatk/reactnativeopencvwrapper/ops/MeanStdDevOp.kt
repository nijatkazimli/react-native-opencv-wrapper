package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.MatOfDouble

/** Per-channel mean and standard deviation of the current image (`meanStdDev`). */
object MeanStdDevOp : DataOp {
  override val name = "meanStdDev"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val meanMat = MatOfDouble()
    val stddevMat = MatOfDouble()
    Core.meanStdDev(current, meanMat, stddevMat)
    val channels = current.channels()
    val mean = JSONArray()
    val stddev = JSONArray()
    val m = meanMat.toArray()
    val s = stddevMat.toArray()
    for (i in 0 until channels) {
      mean.put(m[i])
      stddev.put(s[i])
    }
    meanMat.release()
    stddevMat.release()
    return JSONObject()
      .put("mean", mean)
      .put("stddev", stddev)
      .put("channels", channels)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
