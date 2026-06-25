package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Scalar

/**
 * Run the `mask` sub-pipeline on a copy of the current image to produce a
 * single-channel mask, then keep only the current pixels the mask selects
 * (zeroing the rest). The original image — not the mask — flows out.
 */
object ApplyMaskOp : Op {
  override val name = "applyMask"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val maskOps = params.optJSONArray("mask")
      ?: invalidArg("applyMask 'mask' must be an array of ops")
    val mask = OpRegistry.runSubPipeline(current, maskOps.toString())
    try {
      if (mask.channels() != 1) {
        invalidArg("applyMask sub-pipeline must produce a single-channel mask")
      }
      if (mask.size() != current.size()) {
        invalidArg("applyMask mask must match the current image size")
      }
      val mask8 = if (mask.type() == CvType.CV_8UC1) {
        mask
      } else {
        Mat().also { mask.convertTo(it, CvType.CV_8UC1) }
      }
      val dst = Mat(current.size(), current.type(), Scalar.all(0.0))
      current.copyTo(dst, mask8)
      if (mask8 !== mask) mask8.release()
      return dst
    } finally {
      mask.release()
    }
  }
}
