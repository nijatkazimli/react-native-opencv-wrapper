package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat

/**
 * A terminal analysis operation. Unlike [Op], it inspects the `current` image
 * and returns structured data (as a JSON object) instead of a transformed
 * image. The orchestrator releases `current` after the call.
 *
 * Each analysis op lives in its own file and is registered once in
 * [OpRegistry], mirroring the transform-op convention.
 */
interface DataOp {
  /** Unique analysis op key, matching the JS `type` field. */
  val name: String

  fun analyze(current: Mat, params: JSONObject): JSONObject
}
