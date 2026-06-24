package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.objdetect.QRCodeDetector

/**
 * Detect and decode every QR code in the current image
 * (`QRCodeDetector.detectAndDecodeMulti`). Produces a structured result:
 * `{ "found": Boolean, "codes": [{ "value": String, "corners": [...] }] }`.
 */
object DecodeQROp : DataOp {
  override val name = "decodeQR"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    requireQrSupport()

    val detector = QRCodeDetector()
    val infos = mutableListOf<String>()
    val points = Mat()
    val ok = try {
      detector.detectAndDecodeMulti(current, infos, points)
    } catch (_: Exception) {
      false
    }

    val codes = try {
      if (ok) buildCodes(infos, points) else JSONArray()
    } finally {
      points.release()
    }

    return JSONObject().put("found", codes.length() > 0).put("codes", codes)
  }

  /**
   * `detectAndDecodeMulti` requires OpenCV >= 4.3.0. The host app may provide
   * its own (older) OpenCV, so validate before calling into it.
   */
  private fun requireQrSupport() {
    val major = Core.getVersionMajor()
    val minor = Core.getVersionMinor()
    if (major < 4 || (major == 4 && minor < 3)) {
      throw OpenCVUnavailableException(
        "decodeQR requires OpenCV >= 4.3.0 (found ${Core.VERSION})",
      )
    }
  }

  /** Build the `codes` array, pairing each decoded payload with its corners. */
  private fun buildCodes(infos: List<String>, points: Mat): JSONArray {
    val codes = JSONArray()
    for (i in infos.indices) {
      val corners = cornersForRow(points, i)
      codes.put(JSONObject().put("value", infos[i]).put("corners", corners))
    }
    return codes
  }

  /** Extract the four `{ x, y }` corner points for the QR code at `row`. */
  private fun cornersForRow(points: Mat, row: Int): JSONArray {
    val corners = JSONArray()
    if (row >= points.rows()) return corners
    for (col in 0 until points.cols()) {
      val p = points.get(row, col)
      if (p != null && p.size >= 2) {
        corners.put(JSONObject().put("x", p[0]).put("y", p[1]))
      }
    }
    return corners
  }
}
