package com.nijatk.reactnativeopencvwrapper

import com.facebook.react.bridge.ReactApplicationContext

class ReactNativeOpencvWrapperModule(reactContext: ReactApplicationContext) :
  NativeReactNativeOpencvWrapperSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeReactNativeOpencvWrapperSpec.NAME
  }
}
