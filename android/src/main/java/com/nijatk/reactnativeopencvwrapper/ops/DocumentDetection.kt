package com.nijatk.reactnativeopencvwrapper.ops

import org.opencv.core.Mat
import org.opencv.core.MatOfFloat
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Shared document-edge detector used by both [ScanDocumentOp] (which rectifies
 * the detected quad) and [DetectDocumentOp] (which returns the raw corners).
 * Keeping the detection in one place guarantees the corners reported by
 * `detectDocument` match what `scanDocument` would warp.
 *
 * Pipeline: grayscale -> downscale -> blur -> adaptive (median-based) Canny ->
 * morphological close -> largest convex 4-point contour (epsilon sweep) ->
 * corners scaled back to full resolution.
 */
internal object DocumentDetection {

  // A detected quad must cover at least this fraction of the (downscaled) frame
  // to be treated as the document, so small rectangular artefacts are ignored.
  private const val MIN_AREA_RATIO = 0.10

  // Detect on a downscaled copy so Canny thresholds and contour approximation
  // behave consistently regardless of the source megapixels (and much faster).
  private const val WORK_SIZE = 500.0

  // Try increasingly coarse polygon approximations so documents whose border is
  // slightly curved or noisy still reduce to four corners.
  private val EPS_SWEEP = doubleArrayOf(0.02, 0.03, 0.04, 0.05, 0.06, 0.08)

  /**
   * Find the largest convex 4-point contour covering at least [MIN_AREA_RATIO]
   * of the image, in the pixel coordinate space of [image]. Returns `null` when
   * no suitable quadrilateral is found.
   */
  fun findQuad(image: Mat): Array<Point>? {
    val gray = OpSupport.ensureGray(image)
    val work = Mat()
    val blurred = Mat()
    val edges = Mat()
    val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(5.0, 5.0))
    val contours = ArrayList<MatOfPoint>()
    val hierarchy = Mat()
    try {
      val longSide = max(image.cols(), image.rows()).toDouble()
      val scale = if (longSide > WORK_SIZE) WORK_SIZE / longSide else 1.0
      if (scale != 1.0) {
        Imgproc.resize(
          gray, work,
          Size(
            (image.cols() * scale).roundToInt().toDouble(),
            (image.rows() * scale).roundToInt().toDouble(),
          ),
          0.0, 0.0, Imgproc.INTER_AREA,
        )
      } else {
        gray.copyTo(work)
      }
      Imgproc.GaussianBlur(work, blurred, Size(5.0, 5.0), 0.0)
      val median = medianOf(blurred)
      val lo = max(0.0, 0.66 * median)
      val hi = min(255.0, 1.33 * median)
      Imgproc.Canny(blurred, edges, lo, hi)
      Imgproc.morphologyEx(edges, edges, Imgproc.MORPH_CLOSE, kernel)
      Imgproc.findContours(
        edges, contours, hierarchy,
        Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE,
      )
      contours.sortByDescending { Imgproc.contourArea(it) }
      val minArea = MIN_AREA_RATIO * work.cols() * work.rows()
      val quad = largestQuad(contours, minArea) ?: return null
      if (scale == 1.0) return quad
      val inv = 1.0 / scale
      return Array(4) { Point(quad[it].x * inv, quad[it].y * inv) }
    } finally {
      if (gray !== image) gray.release()
      work.release()
      blurred.release()
      edges.release()
      kernel.release()
      hierarchy.release()
      contours.forEach { it.release() }
    }
  }

  // Median grayscale intensity via a 256-bin histogram, used to derive Canny
  // thresholds that adapt to the image's overall brightness/contrast.
  private fun medianOf(gray: Mat): Double {
    val hist = Mat()
    try {
      Imgproc.calcHist(
        listOf(gray), MatOfInt(0), Mat(), hist,
        MatOfInt(256), MatOfFloat(0f, 256f),
      )
      val half = gray.total() / 2.0
      var cumulative = 0.0
      for (i in 0 until 256) {
        cumulative += hist.get(i, 0)[0]
        if (cumulative >= half) return i.toDouble()
      }
      return 128.0
    } finally {
      hist.release()
    }
  }

  private fun largestQuad(contours: List<MatOfPoint>, minArea: Double): Array<Point>? {
    for (contour in contours.take(10)) {
      val c2f = MatOfPoint2f(*contour.toArray())
      val approx = MatOfPoint2f()
      try {
        val peri = Imgproc.arcLength(c2f, true)
        for (eps in EPS_SWEEP) {
          Imgproc.approxPolyDP(c2f, approx, eps * peri, true)
          val pts = approx.toArray()
          if (pts.size == 4 &&
            Imgproc.isContourConvex(MatOfPoint(*pts)) &&
            Imgproc.contourArea(approx) >= minArea
          ) {
            return pts
          }
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
  fun orderCorners(pts: Array<Point>): Array<Point> {
    val tl = pts.minByOrNull { it.x + it.y }!!
    val br = pts.maxByOrNull { it.x + it.y }!!
    val tr = pts.minByOrNull { it.y - it.x }!!
    val bl = pts.maxByOrNull { it.y - it.x }!!
    return arrayOf(tl, tr, br, bl)
  }
}
