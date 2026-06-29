package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

/**
 * Marker-based watershed segmentation with automatically derived markers; the
 * detected region boundaries are drawn onto the image (`watershed`).
 */
object WatershedOp : Op {
  override val name = "watershed"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val img = if (current.channels() == 1) {
      Mat().also { Imgproc.cvtColor(current, it, Imgproc.COLOR_GRAY2BGR) }
    } else {
      current.clone()
    }

    val gray = Mat()
    Imgproc.cvtColor(img, gray, Imgproc.COLOR_BGR2GRAY)
    val thresh = Mat()
    Imgproc.threshold(gray, thresh, 0.0, 255.0, Imgproc.THRESH_BINARY_INV or Imgproc.THRESH_OTSU)

    val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
    val opening = Mat()
    Imgproc.morphologyEx(thresh, opening, Imgproc.MORPH_OPEN, kernel, Point(-1.0, -1.0), 2)
    val sureBg = Mat()
    Imgproc.dilate(opening, sureBg, kernel, Point(-1.0, -1.0), 3)

    val dist = Mat()
    Imgproc.distanceTransform(opening, dist, Imgproc.DIST_L2, 5)
    val mm = Core.minMaxLoc(dist)
    val sureFg = Mat()
    Imgproc.threshold(dist, sureFg, 0.7 * mm.maxVal, 255.0, Imgproc.THRESH_BINARY)
    sureFg.convertTo(sureFg, CvType.CV_8U)

    val unknown = Mat()
    Core.subtract(sureBg, sureFg, unknown)

    val markers = Mat()
    Imgproc.connectedComponents(sureFg, markers)
    Core.add(markers, Scalar(1.0), markers)
    markers.setTo(Scalar(0.0), unknown)

    Imgproc.watershed(img, markers)

    val line = OpSupport.colorScalar(params.optJSONArray("lineColor"), Scalar(0.0, 0.0, 255.0))
    val out = img.clone()
    val boundary = Mat()
    Core.compare(markers, Scalar(-1.0), boundary, Core.CMP_EQ)
    out.setTo(line, boundary)

    if (img !== current) img.release()
    gray.release()
    thresh.release()
    kernel.release()
    opening.release()
    sureBg.release()
    dist.release()
    sureFg.release()
    unknown.release()
    markers.release()
    boundary.release()
    return out
  }
}
