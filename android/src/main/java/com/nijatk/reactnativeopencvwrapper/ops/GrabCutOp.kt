package com.nijatk.reactnativeopencvwrapper.ops

import kotlin.math.max
import kotlin.math.min
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * GrabCut foreground extraction seeded by a rectangle; background pixels in the
 * result are set to black (`grabCut`).
 */
object GrabCutOp : Op {
  override val name = "grabCut"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val r = params.optJSONObject("rect")
      ?: invalidArg("grabCut 'rect' must be an object {x, y, width, height}")
    var iterations = if (params.has("iterations")) params.getInt("iterations") else 5
    if (iterations < 1) iterations = 1

    val img = if (current.channels() == 1) {
      Mat().also { Imgproc.cvtColor(current, it, Imgproc.COLOR_GRAY2BGR) }
    } else {
      current
    }

    val x1 = max(r.getInt("x"), 0)
    val y1 = max(r.getInt("y"), 0)
    val x2 = min(r.getInt("x") + r.getInt("width"), img.cols())
    val y2 = min(r.getInt("y") + r.getInt("height"), img.rows())
    val rect = Rect(x1, y1, max(0, x2 - x1), max(0, y2 - y1))
    if (rect.width <= 0 || rect.height <= 0) {
      if (img !== current) img.release()
      invalidArg("grabCut 'rect' must overlap the image with positive size")
    }

    val mask = Mat()
    val bgdModel = Mat()
    val fgdModel = Mat()
    Imgproc.grabCut(img, mask, rect, bgdModel, fgdModel, iterations, Imgproc.GC_INIT_WITH_RECT)

    val fg = Mat()
    val prFg = Mat()
    Core.compare(mask, Scalar(Imgproc.GC_FGD.toDouble()), fg, Core.CMP_EQ)
    Core.compare(mask, Scalar(Imgproc.GC_PR_FGD.toDouble()), prFg, Core.CMP_EQ)
    Core.bitwise_or(fg, prFg, fg)

    val out = Mat.zeros(img.size(), img.type())
    img.copyTo(out, fg)

    if (img !== current) img.release()
    mask.release()
    bgdModel.release()
    fgdModel.release()
    fg.release()
    prFg.release()
    return out
  }
}
