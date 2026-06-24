package com.nijatk.reactnativeopencvwrapper

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.nijatk.reactnativeopencvwrapper.ops.OpRegistry
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVDocumentNotFoundException
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVIOException
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVUnavailableException
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVUnknownOpException
import org.json.JSONException
import org.json.JSONObject
import org.opencv.android.OpenCVLoader
import org.opencv.core.Core

class ReactNativeOpencvWrapperModule(reactContext: ReactApplicationContext) :
  NativeReactNativeOpencvWrapperSpec(reactContext) {

  // OpenCVLoader.initLocal() statically links the bundled native library
  // shipped inside the OpenCV Android AAR. We capture the result so op calls
  // can fail fast with a clear message instead of a cryptic UnsatisfiedLinkError.
  private val openCVReady: Boolean =
    runCatching { OpenCVLoader.initLocal() }.getOrDefault(false)

  override fun getOpenCVVersion(): String = Core.VERSION

  override fun toGray(inputPath: String, outputPath: String, promise: Promise) {
    runOp(promise, outputPath) {
      OpRegistry.executeSingle(inputPath, outputPath, "gray")
    }
  }

  override fun gaussianBlur(
    inputPath: String,
    outputPath: String,
    kernelSize: Double,
    sigmaX: Double,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      val k = kernelSize.toInt()
      require(k >= 1 && k % 2 == 1) { "kernelSize must be a positive odd integer" }
      OpRegistry.executeSingle(
        inputPath,
        outputPath,
        "gaussianBlur",
        JSONObject().put("kernelSize", k).put("sigmaX", sigmaX),
      )
    }
  }

  override fun canny(
    inputPath: String,
    outputPath: String,
    threshold1: Double,
    threshold2: Double,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      OpRegistry.executeSingle(
        inputPath,
        outputPath,
        "canny",
        JSONObject().put("threshold1", threshold1).put("threshold2", threshold2),
      )
    }
  }

  override fun runPipeline(
    inputPath: String,
    outputPath: String,
    opsJson: String,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      OpRegistry.execute(inputPath, outputPath, opsJson)
    }
  }

  override fun runPipelineIO(
    inputJson: String,
    outputJson: String,
    opsJson: String,
    promise: Promise
  ) {
    runReturning(promise) {
      OpRegistry.executeIO(inputJson, outputJson, opsJson)
    }
  }

  override fun runPipelineData(
    inputJson: String,
    opsJson: String,
    promise: Promise
  ) {
    runReturning(promise) {
      OpRegistry.executeData(inputJson, opsJson)
    }
  }

  private inline fun runOp(promise: Promise, outputPath: String, block: () -> Unit) {
    if (!openCVReady) {
      promise.reject("opencv_unavailable", "OpenCV native library failed to initialize")
      return
    }
    try {
      block()
      promise.resolve(outputPath)
    } catch (t: Throwable) {
      promise.reject(errorCode(t), t.message ?: t.javaClass.simpleName, t)
    }
  }

  private inline fun runReturning(promise: Promise, block: () -> String) {
    if (!openCVReady) {
      promise.reject("opencv_unavailable", "OpenCV native library failed to initialize")
      return
    }
    try {
      promise.resolve(block())
    } catch (t: Throwable) {
      promise.reject(errorCode(t), t.message ?: t.javaClass.simpleName, t)
    }
  }

  private fun errorCode(t: Throwable): String = when (t) {
    is OpenCVUnknownOpException -> "opencv_unknown_op"
    is OpenCVUnavailableException -> "opencv_unavailable"
    is OpenCVDocumentNotFoundException -> "opencv_document_not_found"
    is OpenCVIOException -> "opencv_io_error"
    is IllegalArgumentException, is JSONException -> "opencv_invalid_argument"
    else -> "opencv_error"
  }

  companion object {
    const val NAME = NativeReactNativeOpencvWrapperSpec.NAME
  }
}
