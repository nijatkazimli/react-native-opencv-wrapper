package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat

/**
 * A single pipeline operation. Implementations transform the `current` image
 * into the next one using parameters from the op's JSON object. Returning the
 * same `Mat` instance signals a no-op (the orchestrator then skips releasing
 * it).
 *
 * Each op lives in its own file and is registered once in [OpRegistry], so
 * adding an op never touches the orchestrator's logic or the TurboModule.
 */
interface Op {
  /** Unique op key, matching the JS `type` field. */
  val name: String

  fun apply(current: Mat, params: JSONObject): Mat
}
