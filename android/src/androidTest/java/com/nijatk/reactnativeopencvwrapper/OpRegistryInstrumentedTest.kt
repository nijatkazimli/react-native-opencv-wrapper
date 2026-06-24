package com.nijatk.reactnativeopencvwrapper

import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.nijatk.reactnativeopencvwrapper.ops.OpRegistry
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVIOException
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVInvalidArgumentException
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVUnknownOpException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.opencv.android.OpenCVLoader
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfByte
import org.opencv.core.Scalar
import org.opencv.imgcodecs.Imgcodecs
import java.io.File

/**
 * Instrumented tests that exercise [OpRegistry] against the real OpenCV native
 * library on a device/emulator. They write a synthetic image to disk, run a
 * pipeline file-to-file, and assert on the decoded result.
 */
@RunWith(AndroidJUnit4::class)
class OpRegistryInstrumentedTest {

  companion object {
    private const val WIDTH = 40
    private const val HEIGHT = 60

    @JvmStatic
    @BeforeClass
    fun loadOpenCV() {
      assertTrue("OpenCV native library failed to load", OpenCVLoader.initLocal())
    }
  }

  private lateinit var cacheDir: File

  @Before
  fun setUp() {
    cacheDir = InstrumentationRegistry.getInstrumentation().targetContext.cacheDir
  }

  /** Create a deterministic 3-channel BGR image and return its file path. */
  private fun writeSourceImage(name: String): String {
    val mat = Mat(HEIGHT, WIDTH, CvType.CV_8UC3, Scalar(10.0, 20.0, 30.0))
    val file = File(cacheDir, name)
    assertTrue(Imgcodecs.imwrite(file.absolutePath, mat))
    mat.release()
    return file.absolutePath
  }

  private fun outputPath(name: String): String = File(cacheDir, name).absolutePath

  private fun readResult(path: String): Mat {
    val mat = Imgcodecs.imread(path, Imgcodecs.IMREAD_UNCHANGED)
    assertTrue("Result image could not be read at $path", !mat.empty())
    return mat
  }

  @Test
  fun grayProducesSingleChannelImage() {
    val input = writeSourceImage("gray-in.png")
    val output = outputPath("gray-out.png")

    OpRegistry.execute(input, output, """[{"type":"gray"}]""")

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun resizeChangesDimensions() {
    val input = writeSourceImage("resize-in.png")
    val output = outputPath("resize-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"resize","width":20,"height":10,"interpolation":"linear"}]""",
    )

    val result = readResult(output)
    assertEquals(20, result.cols())
    assertEquals(10, result.rows())
    result.release()
  }

  @Test
  fun rotate90SwapsDimensions() {
    val input = writeSourceImage("rotate-in.png")
    val output = outputPath("rotate-out.png")

    OpRegistry.execute(input, output, """[{"type":"rotate","angle":90}]""")

    val result = readResult(output)
    assertEquals(HEIGHT, result.cols())
    assertEquals(WIDTH, result.rows())
    result.release()
  }

  @Test
  fun thresholdBinaryProducesExtremeValues() {
    val input = writeSourceImage("threshold-in.png")
    val output = outputPath("threshold-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"threshold","thresh":15,"maxValue":255,"thresholdType":"binary"}]""",
    )

    val result = readResult(output)
    // Source pixel is (B=10, G=20, R=30); a binary threshold at 15 maps each
    // channel to either 0 or 255.
    val pixel = result.get(0, 0)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(255.0, pixel[1], 0.0)
    assertEquals(255.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun multiStepPipelineChainsOps() {
    val input = writeSourceImage("chain-in.png")
    val output = outputPath("chain-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"gray"},{"type":"resize","width":20,"height":10,"interpolation":"nearest"}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(20, result.cols())
    assertEquals(10, result.rows())
    result.release()
  }

  @Test(expected = OpenCVUnknownOpException::class)
  fun unknownOpThrows() {
    val input = writeSourceImage("unknown-in.png")
    val output = outputPath("unknown-out.png")

    OpRegistry.execute(input, output, """[{"type":"notAnOp"}]""")
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun invalidRotateAngleThrows() {
    val input = writeSourceImage("invalid-in.png")
    val output = outputPath("invalid-out.png")

    OpRegistry.execute(input, output, """[{"type":"rotate","angle":45}]""")
  }

  @Test
  fun gaussianBlurPreservesShape() {
    val input = writeSourceImage("blur-in.png")
    val output = outputPath("blur-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"gaussianBlur","kernelSize":5,"sigmaX":0}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun cannyProducesSingleChannelEdges() {
    val input = writeSourceImage("canny-in.png")
    val output = outputPath("canny-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"canny","threshold1":50,"threshold2":150}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun cropExtractsRegion() {
    val input = writeSourceImage("crop-in.png")
    val output = outputPath("crop-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"crop","x":5,"y":10,"width":20,"height":15}]""",
    )

    val result = readResult(output)
    assertEquals(20, result.cols())
    assertEquals(15, result.rows())
    result.release()
  }

  @Test
  fun flipPreservesShape() {
    val input = writeSourceImage("flip-in.png")
    val output = outputPath("flip-out.png")

    OpRegistry.execute(input, output, """[{"type":"flip","direction":"horizontal"}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun medianBlurPreservesShape() {
    val input = writeSourceImage("median-in.png")
    val output = outputPath("median-out.png")

    OpRegistry.execute(input, output, """[{"type":"medianBlur","kernelSize":5}]""")

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun dilatePreservesShape() {
    val input = writeSourceImage("dilate-in.png")
    val output = outputPath("dilate-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"dilate","kernelSize":3,"iterations":1}]""",
    )

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun erodePreservesShape() {
    val input = writeSourceImage("erode-in.png")
    val output = outputPath("erode-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"erode","kernelSize":3,"iterations":2}]""",
    )

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  // --- In-memory / base64 I/O (executeIO) ------------------------------------

  /** Encode the synthetic source image to a base64 string for `executeIO`. */
  private fun sourceBase64(ext: String = ".png"): String {
    val mat = Mat(HEIGHT, WIDTH, CvType.CV_8UC3, Scalar(10.0, 20.0, 30.0))
    val buffer = MatOfByte()
    assertTrue("failed to encode source image", Imgcodecs.imencode(ext, mat, buffer))
    val bytes = buffer.toArray()
    buffer.release()
    mat.release()
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
  }

  /** Decode a base64 result string back into a [Mat] for assertions. */
  private fun decodeBase64Result(b64: String): Mat {
    val bytes = Base64.decode(b64, Base64.DEFAULT)
    val encoded = MatOfByte(*bytes)
    val mat = Imgcodecs.imdecode(encoded, Imgcodecs.IMREAD_UNCHANGED)
    encoded.release()
    assertTrue("base64 result could not be decoded", !mat.empty())
    return mat
  }

  @Test
  fun base64InputToPathOutput() {
    val output = outputPath("io-b64-in.png")

    val result = OpRegistry.executeIO(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """{"kind":"path","value":"$output"}""",
      """[{"type":"gray"}]""",
    )

    assertEquals(output, result)
    val mat = readResult(output)
    assertEquals(1, mat.channels())
    assertEquals(WIDTH, mat.cols())
    assertEquals(HEIGHT, mat.rows())
    mat.release()
  }

  @Test
  fun pathInputToBase64Output() {
    val input = writeSourceImage("io-b64-out.png")

    val result = OpRegistry.executeIO(
      """{"kind":"path","value":"$input"}""",
      """{"kind":"base64","ext":".png"}""",
      """[{"type":"gray"}]""",
    )

    assertTrue("base64 result should not be empty", result.isNotEmpty())
    val mat = decodeBase64Result(result)
    assertEquals(1, mat.channels())
    assertEquals(WIDTH, mat.cols())
    assertEquals(HEIGHT, mat.rows())
    mat.release()
  }

  @Test
  fun base64InputToBase64Output() {
    val result = OpRegistry.executeIO(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """{"kind":"base64","ext":".png"}""",
      """[{"type":"resize","width":20,"height":10,"interpolation":"linear"}]""",
    )

    val mat = decodeBase64Result(result)
    assertEquals(20, mat.cols())
    assertEquals(10, mat.rows())
    mat.release()
  }

  @Test
  fun base64OutputDefaultsToPngWhenExtOmitted() {
    val result = OpRegistry.executeIO(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """{"kind":"base64"}""",
      """[{"type":"gray"}]""",
    )

    val mat = decodeBase64Result(result)
    assertEquals(1, mat.channels())
    assertEquals(WIDTH, mat.cols())
    assertEquals(HEIGHT, mat.rows())
    mat.release()
  }

  @Test
  fun base64InputAcceptsDataUriPrefix() {
    val output = outputPath("io-datauri.png")

    val result = OpRegistry.executeIO(
      """{"kind":"base64","value":"data:image/png;base64,${sourceBase64()}"}""",
      """{"kind":"path","value":"$output"}""",
      """[{"type":"gray"}]""",
    )

    assertEquals(output, result)
    val mat = readResult(output)
    assertEquals(1, mat.channels())
    mat.release()
  }

  @Test(expected = OpenCVIOException::class)
  fun invalidBase64InputThrows() {
    OpRegistry.executeIO(
      """{"kind":"base64","value":"not valid base64!!!"}""",
      """{"kind":"base64","ext":".png"}""",
      """[{"type":"gray"}]""",
    )
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun unknownInputKindThrows() {
    OpRegistry.executeIO(
      """{"kind":"bogus"}""",
      """{"kind":"base64","ext":".png"}""",
      """[{"type":"gray"}]""",
    )
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun unknownOutputKindThrows() {
    OpRegistry.executeIO(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """{"kind":"bogus"}""",
      """[{"type":"gray"}]""",
    )
  }

  @Test(expected = OpenCVUnknownOpException::class)
  fun unknownOpThrowsThroughExecuteIO() {
    OpRegistry.executeIO(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """{"kind":"base64","ext":".png"}""",
      """[{"type":"notAnOp"}]""",
    )
  }
}
