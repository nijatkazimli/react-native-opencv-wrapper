package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc

/**
 * Locate a smaller template image within the current image (`matchTemplate`)
 * and return the best match location and score.
 */
object MatchTemplateOp : DataOp {
  override val name = "matchTemplate"

  override fun analyze(current: Mat, params: JSONObject): JSONObject {
    val source = params.optString("template", "")
    if (source.isEmpty()) {
      invalidArg("matchTemplate 'template' must be a string path or base64 image")
    }
    val method = methodFlag(params.optString("method", "ccoeffNormed"))

    val tmplColor = OpSupport.decodeImageArg(source, Imgcodecs.IMREAD_COLOR)
    val img = OpSupport.ensureGray(current)
    val tmpl = OpSupport.ensureGray(tmplColor)
    try {
      if (tmpl.cols() > img.cols() || tmpl.rows() > img.rows()) {
        invalidArg("matchTemplate template must not be larger than the image")
      }
      val result = Mat()
      Imgproc.matchTemplate(img, tmpl, result, method)
      val mm = Core.minMaxLoc(result)
      result.release()

      val useMin = method == Imgproc.TM_SQDIFF || method == Imgproc.TM_SQDIFF_NORMED
      val loc = if (useMin) mm.minLoc else mm.maxLoc
      val score = if (useMin) mm.minVal else mm.maxVal
      return JSONObject()
        .put("found", true)
        .put("score", score)
        .put("location", JSONObject().put("x", loc.x.toInt()).put("y", loc.y.toInt()))
        .put("templateWidth", tmpl.cols())
        .put("templateHeight", tmpl.rows())
        .put("width", current.cols())
        .put("height", current.rows())
    } finally {
      if (img !== current) img.release()
      if (tmpl !== tmplColor) tmpl.release()
      tmplColor.release()
    }
  }

  private fun methodFlag(name: String): Int = when (name) {
    "sqdiff" -> Imgproc.TM_SQDIFF
    "sqdiffNormed" -> Imgproc.TM_SQDIFF_NORMED
    "ccorr" -> Imgproc.TM_CCORR
    "ccorrNormed" -> Imgproc.TM_CCORR_NORMED
    "ccoeff" -> Imgproc.TM_CCOEFF
    else -> Imgproc.TM_CCOEFF_NORMED
  }
}
