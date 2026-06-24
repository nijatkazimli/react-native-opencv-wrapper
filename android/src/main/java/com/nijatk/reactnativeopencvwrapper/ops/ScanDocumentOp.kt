package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
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
 * Pipeline: grayscale -> blur -> Canny -> dilate -> largest convex 4-point
 * contour -> `getPerspectiveTransform` + `warpPerspective`. Throws
 * [OpenCVDocumentNotFoundException] when no suitable quadrilateral is found.
 */
object ScanDocumentOp : Op {
  override val name = "scanDocument"

  private const val MIN_AREA_RATIO = 0.10

  override fun apply(current: Mat, params: JSONObject): Mat {
    val quad = findDocumentQuad(current)
      ?: throw OpenCVDocumentNotFoundException(
        "scanDocument: no document-like quadrilateral found",
      )
    return warpToDocument(current, orderCorners(quad))
  }

  private fun findDocumentQuad(image: Mat): Array<Point>? {
    val gray = OpSupport.ensureGray(image)
    val blurred = Mat()
    val edges = Mat()
    val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
    val contours = ArrayList<MatOfPoint>()
    val hierarchy = Mat()
    try {
      Imgproc.GaussianBlur(gray, blurred, Size(5.0, 5.0), 0.0)
      Imgproc.Canny(blurred, edges, 50.0, 150.0)
      Imgproc.dilate(edges, edges, kernel)
      Imgproc.findContours(
        edges, contours, hierarchy,
        Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE,
      )
      contours.sortByDescending { Imgproc.contourArea(it) }
      val minArea = MIN_AREA_RATIO * image.cols() * image.rows()
      return largestQuad(contours, minArea)
    } finally {
      if (gray !== image) gray.release()
      blurred.release()
      edges.release()
      kernel.release()
      hierarchy.release()
      contours.forEach { it.release() }
    }
  }

  private fun largestQuad(contours: List<MatOfPoint>, minArea: Double): Array<Point>? {
    for (contour in contours.take(10)) {
      val c2f = MatOfPoint2f(*contour.toArray())
      val approx = MatOfPoint2f()
      try {
        val peri = Imgproc.arcLength(c2f, true)
        Imgproc.approxPolyDP(c2f, approx, 0.02 * peri, true)
        val pts = approx.toArray()
        if (pts.size == 4 &&
          Imgproc.isContourConvex(MatOfPoint(*pts)) &&
          Imgproc.contourArea(approx) >= minArea
        ) {
          return pts
        }
      } finally {
        c2f.release()
        approx.release()
      }
    }
    return null
  }

  // Order four corners as top-left, top-right, bottom-right, bottom-left using
  // the sum/diff heuristic (tl has the smallest x+y, br the largest; tr the
  // smallest y-x, bl the largest).
  private fun orderCorners(pts: Array<Point>): Array<Point> {
    val tl = pts.minByOrNull { it.x + it.y }!!
    val br = pts.maxByOrNull { it.x + it.y }!!
    val tr = pts.minByOrNull { it.y - it.x }!!
    val bl = pts.maxByOrNull { it.y - it.x }!!
    return arrayOf(tl, tr, br, bl)
  }

  private fun warpToDocument(current: Mat, ordered: Array<Point>): Mat {
    val (tl, tr, br, bl) = ordered
    val widthTop = hypot(tr.x - tl.x, tr.y - tl.y)
    val widthBottom = hypot(br.x - bl.x, br.y - bl.y)
    val heightLeft = hypot(bl.x - tl.x, bl.y - tl.y)
    val heightRight = hypot(br.x - tr.x, br.y - tr.y)
    val outW = max(1, max(widthTop, widthBottom).roundToInt())
    val outH = max(1, max(heightLeft, heightRight).roundToInt())

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
