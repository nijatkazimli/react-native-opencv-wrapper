package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat

object DebugOp : Op {
  override val name = "debug"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val path = params.optString("path")
    if (path.isEmpty()) {
      invalidArg("debug 'path' is required and must be a non-empty string")
    }
    OpSupport.writeOrThrow(path, current)
    // Return the same instance so the orchestrator treats this as a no-op and
    // keeps the image for the next step (a pass-through tap).
    return current
  }
}
