package com.nijatk.reactnativeopencvwrapper.ops

/**
 * Typed failures that the TurboModule maps to stable Promise rejection codes
 * (mirrored on iOS), so JS callers can branch on the failure kind instead of
 * string-matching messages.
 */

/** Bad or missing parameters / out-of-range values. */
class OpenCVInvalidArgumentException(message: String) : IllegalArgumentException(message)

/** Image could not be read from or written to disk. */
class OpenCVIOException(message: String) : RuntimeException(message)

/** A pipeline referenced an op `type` with no registered handler. */
class OpenCVUnknownOpException(message: String) : RuntimeException(message)

/** Throw an invalid-argument failure with `message`. */
internal fun invalidArg(message: String): Nothing =
  throw OpenCVInvalidArgumentException(message)
