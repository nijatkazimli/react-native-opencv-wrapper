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
    // detectAndDecodeMulti requires OpenCV >= 4.3.0. The host app may provide
    // its own (older) OpenCV, so validate before calling into it.
    if (Core.getVersionMajor() < 4 ||
      (Core.getVersionMajor() == 4 && Core.getVersionMinor() < 3)
    ) {
      throw OpenCVUnavailableException(
        "decodeQR requires OpenCV >= 4.3.0 (found ${Core.VERSION})",
      )
    }

    val detector = QRCodeDetector()
    val infos = mutableListOf<String>()
    val points = Mat()
    val ok = try {
      detector.detectAndDecodeMulti(current, infos, points)
    } catch (_: Exception) {
      false
    }

    val codes = JSONArray()
    try {
      if (ok) {
        for (i in infos.indices) {
          val corners = JSONArray()
          if (i < points.rows()) {
            for (j in 0 until points.cols()) {
              val p = points.get(i, j)
              if (p != null && p.size >= 2) {
                corners.put(JSONObject().put("x", p[0]).put("y", p[1]))
              }
            }
          }
          codes.put(JSONObject().put("value", infos[i]).put("corners", corners))
        }
      }
    } finally {
      points.release()
    }

    return JSONObject().put("found", codes.length() > 0).put("codes", codes)
  }
}
