package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.imgproc.Imgproc

/**
 * Detect corner feature points (`cv::goodFeaturesToTrack`) and return them as a
 * point list, strongest first. Uses the Shi-Tomasi measure by default, or the
 * Harris detector when `useHarrisDetector` is set. Operates on a grayscale view
 * of the image.
 */
object GoodFeaturesToTrackOp : DataOp {
  override val name = "goodFeaturesToTrack"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val maxCorners = if (params.has("maxCorners")) params.getInt("maxCorners") else 100
    val qualityLevel = params.optDouble("qualityLevel", 0.01)
    if (qualityLevel <= 0.0) invalidArg("goodFeaturesToTrack 'qualityLevel' must be > 0")
    val minDistance = params.optDouble("minDistance", 10.0)
    if (minDistance < 0.0) invalidArg("goodFeaturesToTrack 'minDistance' must be >= 0")
    val blockSize = if (params.has("blockSize")) params.getInt("blockSize") else 3
    if (blockSize < 1) invalidArg("goodFeaturesToTrack 'blockSize' must be >= 1")
    val useHarris = params.optBoolean("useHarrisDetector", false)
    val k = params.optDouble("k", 0.04)

    val gray = OpSupport.ensureGray(current)
    val corners = MatOfPoint()
    val mask = Mat()
    try {
      Imgproc.goodFeaturesToTrack(
        gray, corners, maxCorners, qualityLevel, minDistance,
        mask, blockSize, useHarris, k,
      )
      val out = JSONArray()
      for (p in corners.toArray()) {
        out.put(JSONObject().put("x", p.x).put("y", p.y))
      }
      return JSONObject()
        .put("found", out.length() > 0)
        .put("count", out.length())
        .put("corners", out)
        .put("width", current.cols())
        .put("height", current.rows())
    } finally {
      if (gray !== current) gray.release()
      corners.release()
      mask.release()
    }
  }
}
