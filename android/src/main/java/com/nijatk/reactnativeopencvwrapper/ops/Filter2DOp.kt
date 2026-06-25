package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object Filter2DOp : Op {
  override val name = "filter2D"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val rows = params.optJSONArray("kernel")
      ?: invalidArg("filter2D 'kernel' must be a 2D array of numbers")
    if (rows.length() == 0) invalidArg("filter2D 'kernel' must have at least one row")

    val firstRow = rows.optJSONArray(0)
      ?: invalidArg("filter2D 'kernel' rows must be arrays of numbers")
    val cols = firstRow.length()
    if (cols == 0) invalidArg("filter2D 'kernel' rows must not be empty")

    val kernel = Mat(rows.length(), cols, CvType.CV_64F)
    for (r in 0 until rows.length()) {
      val row = rows.optJSONArray(r)
        ?: invalidArg("filter2D 'kernel' rows must be arrays of numbers")
      if (row.length() != cols) {
        invalidArg("filter2D 'kernel' rows must all have the same length")
      }
      for (c in 0 until cols) kernel.put(r, c, row.getDouble(c))
    }

    return Mat().also {
      Imgproc.filter2D(current, it, -1, kernel)
      kernel.release()
    }
  }
}
