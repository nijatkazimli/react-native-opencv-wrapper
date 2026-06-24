package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat

/**
 * Locate the largest document-like quadrilateral and return its four corner
 * points without warping (detection shared with [ScanDocumentOp] via
 * [DocumentDetection]). Produces a structured result:
 * `{ "found": Boolean, "corners": [{ "x", "y" }...], "width": Int, "height": Int }`.
 *
 * Unlike [ScanDocumentOp], a missing document is not an error: the result is
 * `{ found: false, corners: [] }`, which suits per-frame overlay use.
 */
object DetectDocumentOp : DataOp {
  override val name = "detectDocument"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val quad = DocumentDetection.findQuad(current)
    val corners = JSONArray()
    if (quad != null) {
      for (p in DocumentDetection.orderCorners(quad)) {
        corners.put(JSONObject().put("x", p.x).put("y", p.y))
      }
    }
    return JSONObject()
      .put("found", quad != null)
      .put("corners", corners)
      .put("width", current.cols())
      .put("height", current.rows())
  }
}
