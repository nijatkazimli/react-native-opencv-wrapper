package com.nijatk.reactnativeopencvwrapper

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.nijatk.reactnativeopencvwrapper.ops.OpRegistry
import org.json.JSONObject
import org.opencv.android.OpenCVLoader
import org.opencv.core.Core

class ReactNativeOpencvWrapperModule(reactContext: ReactApplicationContext) :
  NativeReactNativeOpencvWrapperSpec(reactContext) {

  init {
    // OpenCVLoader.initLocal() statically links the bundled native library
    // shipped inside the OpenCV Android AAR. Failures will surface in op
    // calls rather than crashing module construction.
    runCatching { OpenCVLoader.initLocal() }
  }

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

  private inline fun runOp(promise: Promise, outputPath: String, block: () -> Unit) {
    try {
      block()
      promise.resolve(outputPath)
    } catch (t: Throwable) {
      promise.reject("opencv_error", t.message ?: t.javaClass.simpleName, t)
    }
  }

  companion object {
    const val NAME = NativeReactNativeOpencvWrapperSpec.NAME
  }
}
