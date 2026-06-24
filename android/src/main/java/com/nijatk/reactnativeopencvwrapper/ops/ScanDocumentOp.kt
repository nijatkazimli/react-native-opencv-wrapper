package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * One-call document scanner: detect the largest document-like quadrilateral and
 * return a top-down, perspective-corrected (deskewed) crop of it.
 *
 * Detection is shared with [DetectDocumentOp] via [DocumentDetection]; this op
 * adds `getPerspectiveTransform` + `warpPerspective` plus optional output mode
 * and aspect-ratio handling. Throws [OpenCVDocumentNotFoundException] when no
 * suitable quadrilateral is found.
 */
object ScanDocumentOp : Op {
  override val name = "scanDocument"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val quad = DocumentDetection.findQuad(current)
      ?: throw OpenCVDocumentNotFoundException(
        "scanDocument: no document-like quadrilateral found",
      )
    val warped = warpToDocument(
      current,
      DocumentDetection.orderCorners(quad),
      params.optDouble("aspectRatio", 0.0),
    )
    return applyMode(warped, params.optString("mode", "color"))
  }

  // Render the rectified crop as colour (default), grayscale, or a high-contrast
  // black-and-white "scanned paper" look via an adaptive threshold.
  private fun applyMode(warped: Mat, mode: String): Mat {
    if (mode != "gray" && mode != "bw") return warped
    val gray = OpSupport.ensureGray(warped)
    if (mode == "gray") {
      if (gray !== warped) warped.release()
      return gray
    }
    val bw = Mat()
    Imgproc.adaptiveThreshold(
      gray, bw, 255.0,
      Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C, Imgproc.THRESH_BINARY, 31, 10.0,
    )
    if (gray !== warped) gray.release()
    warped.release()
    return bw
  }

  private fun warpToDocument(
    current: Mat,
    ordered: Array<Point>,
    aspectRatio: Double,
  ): Mat {
    val (tl, tr, br, bl) = ordered
    val widthTop = hypot(tr.x - tl.x, tr.y - tl.y)
    val widthBottom = hypot(br.x - bl.x, br.y - bl.y)
    val heightLeft = hypot(bl.x - tl.x, bl.y - tl.y)
    val heightRight = hypot(br.x - tr.x, br.y - tr.y)
    var outW = max(1, max(widthTop, widthBottom).roundToInt())
    var outH = max(1, max(heightLeft, heightRight).roundToInt())

    // Optional aspect-ratio override (width / height): expand the shorter side
    // so the document keeps at least its detected resolution.
    if (aspectRatio > 0.0) {
      val currentRatio = outW.toDouble() / outH.toDouble()
      if (aspectRatio >= currentRatio) {
        outW = max(1, (outH * aspectRatio).roundToInt())
      } else {
        outH = max(1, (outW / aspectRatio).roundToInt())
      }
    }

    val src = MatOfPoint2f(tl, tr, br, bl)
    val dst = MatOfPoint2f(
      Point(0.0, 0.0),
      Point((outW - 1).toDouble(), 0.0),
      Point((outW - 1).toDouble(), (outH - 1).toDouble()),
      Point(0.0, (outH - 1).toDouble()),
    )
    val transform = Imgproc.getPerspectiveTransform(src, dst)
    val warped = Mat()
    try {
      Imgproc.warpPerspective(
        current, warped, transform, Size(outW.toDouble(), outH.toDouble()),
      )
    } finally {
      src.release()
      dst.release()
      transform.release()
    }
    return warped
  }
}
