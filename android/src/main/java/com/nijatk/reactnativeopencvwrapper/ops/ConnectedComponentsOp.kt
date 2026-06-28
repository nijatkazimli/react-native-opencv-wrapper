package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Label connected foreground regions and return area/bbox/centroid per
 * component (background label 0 excluded), ordered largest-area first. Treats
 * the image as a binary mask, so chain gray() + threshold() first.
 */
object ConnectedComponentsOp : DataOp {
  override val name = "connectedComponents"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val connectivity = if (params.has("connectivity")) params.getInt("connectivity") else 8
    if (connectivity != 4 && connectivity != 8) invalidArg("connectedComponents connectivity must be 4 or 8")
    val minArea = params.optDouble("minArea", 0.0)

    val gray = OpSupport.ensureGray(current)
    val labels = Mat()
    val stats = Mat()
    val centroids = Mat()
    val comps = ArrayList<JSONObject>()
    try {
      val total = Imgproc.connectedComponentsWithStats(gray, labels, stats, centroids, connectivity, CvType.CV_32S)
      for (i in 1 until total) {
        val area = stats.get(i, Imgproc.CC_STAT_AREA)[0]
        if (area < minArea) continue
        comps.add(
          JSONObject()
            .put("label", i)
            .put("area", area)
            .put(
              "boundingBox",
              JSONObject()
                .put("x", stats.get(i, Imgproc.CC_STAT_LEFT)[0])
                .put("y", stats.get(i, Imgproc.CC_STAT_TOP)[0])
                .put("width", stats.get(i, Imgproc.CC_STAT_WIDTH)[0])
                .put("height", stats.get(i, Imgproc.CC_STAT_HEIGHT)[0]),
            )
            .put("centroid", JSONObject().put("x", centroids.get(i, 0)[0]).put("y", centroids.get(i, 1)[0])),
        )
      }
    } finally {
      if (gray !== current) gray.release()
      labels.release()
      stats.release()
      centroids.release()
    }
    comps.sortByDescending { it.getDouble("area") }

    val out = JSONArray()
    comps.forEach { out.put(it) }
    return JSONObject()
      .put("found", out.length() > 0)
      .put("count", out.length())
      .put("components", out)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
