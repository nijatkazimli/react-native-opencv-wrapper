package com.nijatk.reactnativeopencvwrapper

import android.util.Base64
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.nijatk.reactnativeopencvwrapper.ops.OpRegistry
import com.nijatk.reactnativeopencvwrapper.ops.OpenCVDocumentNotFoundException
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
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc
import org.opencv.objdetect.QRCodeEncoder
import org.json.JSONObject
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

  @Test
  fun cvtColorBgrToHsvPreservesChannels() {
    val input = writeSourceImage("cvtcolor-in.png")
    val output = outputPath("cvtcolor-out.png")

    OpRegistry.execute(input, output, """[{"type":"cvtColor","code":"BGR2HSV"}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun cvtColorBgrToGrayProducesSingleChannel() {
    val input = writeSourceImage("cvtcolor-gray-in.png")
    val output = outputPath("cvtcolor-gray-out.png")

    OpRegistry.execute(input, output, """[{"type":"cvtColor","code":"BGR2GRAY"}]""")

    val result = readResult(output)
    assertEquals(1, result.channels())
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun cvtColorInvalidCodeThrows() {
    val input = writeSourceImage("cvtcolor-bad-in.png")
    val output = outputPath("cvtcolor-bad-out.png")

    OpRegistry.execute(input, output, """[{"type":"cvtColor","code":"BGR2XYZZY"}]""")
  }

  @Test
  fun inRangeProducesBinaryMask() {
    val input = writeSourceImage("inrange-in.png")
    val output = outputPath("inrange-out.png")

    // Source pixel is (B=10, G=20, R=30); the bounds include it, so the whole
    // mask is 255.
    OpRegistry.execute(
      input,
      output,
      """[{"type":"inRange","lower":[5,15,25],"upper":[15,25,35]}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(255.0, result.get(0, 0)[0], 0.0)
    result.release()
  }

  @Test
  fun inRangeOutOfBoundsProducesZeroMask() {
    val input = writeSourceImage("inrange-zero-in.png")
    val output = outputPath("inrange-zero-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"inRange","lower":[100,100,100],"upper":[200,200,200]}]""",
    )

    val result = readResult(output)
    assertEquals(0.0, result.get(0, 0)[0], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun inRangeMismatchedBoundsThrow() {
    val input = writeSourceImage("inrange-bad-in.png")
    val output = outputPath("inrange-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"inRange","lower":[0,0],"upper":[255,255,255]}]""",
    )
  }

  @Test
  fun filter2DIdentityKernelPreservesImage() {
    val input = writeSourceImage("filter2d-in.png")
    val output = outputPath("filter2d-out.png")

    OpRegistry.execute(input, output, """[{"type":"filter2D","kernel":[[1]]}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun filter2DRaggedKernelThrows() {
    val input = writeSourceImage("filter2d-bad-in.png")
    val output = outputPath("filter2d-bad-out.png")

    OpRegistry.execute(input, output, """[{"type":"filter2D","kernel":[[1,2],[3]]}]""")
  }

  @Test
  fun debugWritesIntermediateAndPassesThrough() {
    val input = writeSourceImage("debug-in.png")
    val output = outputPath("debug-out.png")
    val capture = outputPath("debug-capture.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"gray"},{"type":"debug","path":"$capture"},{"type":"canny","threshold1":50,"threshold2":150}]""",
    )

    // The capture is the grayscale intermediate (single channel).
    val captured = readResult(capture)
    assertEquals(1, captured.channels())
    captured.release()

    // The pipeline continued past debug to produce the canny edge map.
    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun debugWithoutPathThrows() {
    val input = writeSourceImage("debug-bad-in.png")
    val output = outputPath("debug-bad-out.png")

    OpRegistry.execute(input, output, """[{"type":"debug"}]""")
  }

  @Test
  fun adaptiveThresholdProducesSingleChannelBinary() {
    val input = writeSourceImage("adaptive-in.png")
    val output = outputPath("adaptive-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"adaptiveThreshold","maxValue":255,"blockSize":11,"c":2,"method":"gaussian","thresholdType":"binary"}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    // A uniform image with C=2 keeps every pixel above its local mean → 255.
    assertEquals(255.0, result.get(0, 0)[0], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun adaptiveThresholdEvenBlockSizeThrows() {
    val input = writeSourceImage("adaptive-bad-in.png")
    val output = outputPath("adaptive-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"adaptiveThreshold","maxValue":255,"blockSize":4,"c":2,"method":"mean","thresholdType":"binary"}]""",
    )
  }

  @Test
  fun morphologyExOpenPreservesUniformImage() {
    val input = writeSourceImage("morph-in.png")
    val output = outputPath("morph-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"morphologyEx","operation":"open","kernelSize":3,"iterations":1}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun morphologyExUnknownOperationThrows() {
    val input = writeSourceImage("morph-bad-in.png")
    val output = outputPath("morph-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"morphologyEx","operation":"spin","kernelSize":3,"iterations":1}]""",
    )
  }

  @Test
  fun bitwiseNotInvertsPixels() {
    val input = writeSourceImage("bitnot-in.png")
    val output = outputPath("bitnot-out.png")

    OpRegistry.execute(input, output, """[{"type":"bitwiseNot"}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    // (10, 20, 30) inverts to (245, 235, 225).
    val pixel = result.get(0, 0)
    assertEquals(245.0, pixel[0], 0.0)
    assertEquals(235.0, pixel[1], 0.0)
    assertEquals(225.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun applyMaskKeepsSelectedPixels() {
    val input = writeSourceImage("applymask-in.png")
    val output = outputPath("applymask-out.png")

    // The sub-pipeline mask selects the source pixel (10,20,30), so the
    // original color flows through unchanged.
    OpRegistry.execute(
      input,
      output,
      """[{"type":"applyMask","mask":[{"type":"inRange","lower":[5,15,25],"upper":[15,25,35]}]}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun applyMaskZeroesUnselectedPixels() {
    val input = writeSourceImage("applymask-zero-in.png")
    val output = outputPath("applymask-zero-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"applyMask","mask":[{"type":"inRange","lower":[100,100,100],"upper":[200,200,200]}]}]""",
    )

    val result = readResult(output)
    val pixel = result.get(0, 0)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(0.0, pixel[1], 0.0)
    assertEquals(0.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun applyMaskMultiChannelMaskThrows() {
    val input = writeSourceImage("applymask-bad-in.png")
    val output = outputPath("applymask-bad-out.png")

    // An empty sub-pipeline leaves the 3-channel clone untouched, which is not
    // a valid single-channel mask.
    OpRegistry.execute(input, output, """[{"type":"applyMask","mask":[]}]""")
  }

  // --- Drawing / annotation ops ----------------------------------------------

  @Test
  fun drawRectStrokesBorderColor() {
    val input = writeSourceImage("drawrect-in.png")
    val output = outputPath("drawrect-out.png")

    // color [r,g,b] = [250,20,10] -> BGR Scalar(10,20,250).
    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawRect","x":5,"y":10,"width":30,"height":40,"color":[250,20,10],"thickness":4}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // A pixel on the (axis-aligned) top edge carries the stroke color.
    val pixel = result.get(10, 20)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(250.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun drawRectZeroSizeThrows() {
    val input = writeSourceImage("drawrect-bad-in.png")
    val output = outputPath("drawrect-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawRect","x":5,"y":5,"width":0,"height":10,"color":[255,0,0],"thickness":2}]""",
    )
  }

  @Test
  fun drawCircleLeavesCenterHollow() {
    val input = writeSourceImage("drawcircle-in.png")
    val output = outputPath("drawcircle-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawCircle","centerX":20,"centerY":30,"radius":10,"color":[250,20,10],"thickness":2}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // The outline is hollow, so the center keeps the source color (10,20,30).
    val center = result.get(30, 20)
    assertEquals(10.0, center[0], 0.0)
    assertEquals(20.0, center[1], 0.0)
    assertEquals(30.0, center[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun drawCircleZeroRadiusThrows() {
    val input = writeSourceImage("drawcircle-bad-in.png")
    val output = outputPath("drawcircle-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawCircle","centerX":20,"centerY":30,"radius":0,"color":[255,0,0],"thickness":2}]""",
    )
  }

  @Test
  fun drawLineStrokesColor() {
    val input = writeSourceImage("drawline-in.png")
    val output = outputPath("drawline-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawLine","x1":0,"y1":30,"x2":39,"y2":30,"color":[250,20,10],"thickness":4}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(30, 20)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(250.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun drawLineZeroThicknessThrows() {
    val input = writeSourceImage("drawline-bad-in.png")
    val output = outputPath("drawline-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawLine","x1":0,"y1":0,"x2":10,"y2":10,"color":[255,0,0],"thickness":0}]""",
    )
  }

  @Test
  fun putTextPreservesDimensions() {
    val input = writeSourceImage("puttext-in.png")
    val output = outputPath("puttext-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"putText","text":"Hi","x":2,"y":40,"fontScale":1,"color":[255,255,0],"thickness":2}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun putTextEmptyTextThrows() {
    val input = writeSourceImage("puttext-bad-in.png")
    val output = outputPath("puttext-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"putText","text":"","x":2,"y":40,"fontScale":1,"color":[255,0,0],"thickness":2}]""",
    )
  }

  @Test
  fun drawPolygonStrokesEdgeColor() {
    val input = writeSourceImage("drawpoly-in.png")
    val output = outputPath("drawpoly-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawPolygon","points":[[5,5],[35,5],[35,55],[5,55]],"color":[250,20,10],"thickness":4}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // The (axis-aligned) top edge between [5,5] and [35,5] carries the color.
    val pixel = result.get(5, 20)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(250.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun drawPolygonTooFewPointsThrows() {
    val input = writeSourceImage("drawpoly-bad-in.png")
    val output = outputPath("drawpoly-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawPolygon","points":[[5,5]],"color":[255,0,0],"thickness":2}]""",
    )
  }

  @Test
  fun drawRectFillColorFloodsInteriorAndStrokesBorder() {
    val input = writeSourceImage("drawrect-fill-in.png")
    val output = outputPath("drawrect-fill-out.png")

    // Distinct stroke vs fill: stroke [12,34,56] -> BGR(56,34,12),
    // fillColor [250,20,10] -> BGR(10,20,250).
    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawRect","x":5,"y":10,"width":30,"height":40,"color":[12,34,56],"thickness":2,"fillColor":[250,20,10]}]""",
    )

    val result = readResult(output)
    // The interior carries the fill color.
    val interior = result.get(30, 20)
    assertEquals(10.0, interior[0], 0.0)
    assertEquals(20.0, interior[1], 0.0)
    assertEquals(250.0, interior[2], 0.0)
    // The top edge still carries the (separate) stroke color.
    val border = result.get(10, 20)
    assertEquals(56.0, border[0], 0.0)
    assertEquals(34.0, border[1], 0.0)
    assertEquals(12.0, border[2], 0.0)
    result.release()
  }

  @Test
  fun drawCircleFillColorFloodsInterior() {
    val input = writeSourceImage("drawcircle-fill-in.png")
    val output = outputPath("drawcircle-fill-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawCircle","centerX":20,"centerY":30,"radius":10,"color":[12,34,56],"thickness":2,"fillColor":[250,20,10]}]""",
    )

    val result = readResult(output)
    // A filled disc paints its interior, so the center carries the fill color.
    val center = result.get(30, 20)
    assertEquals(10.0, center[0], 0.0)
    assertEquals(20.0, center[1], 0.0)
    assertEquals(250.0, center[2], 0.0)
    result.release()
  }

  @Test
  fun drawCircleAliasedEdgesSucceed() {
    val input = writeSourceImage("drawcircle-alias-in.png")
    val output = outputPath("drawcircle-alias-out.png")

    // antialias=false routes through LINE_8; result must still decode cleanly.
    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawCircle","centerX":20,"centerY":30,"radius":10,"color":[250,20,10],"thickness":2,"antialias":false}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun drawPolygonFillColorFloodsInteriorAndStrokesEdge() {
    val input = writeSourceImage("drawpoly-fill-in.png")
    val output = outputPath("drawpoly-fill-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawPolygon","points":[[5,5],[35,5],[35,55],[5,55]],"color":[12,34,56],"thickness":2,"fillColor":[250,20,10]}]""",
    )

    val result = readResult(output)
    // An inside pixel carries the fill color.
    val interior = result.get(30, 20)
    assertEquals(10.0, interior[0], 0.0)
    assertEquals(20.0, interior[1], 0.0)
    assertEquals(250.0, interior[2], 0.0)
    // The (axis-aligned) top edge still carries the stroke color.
    val border = result.get(5, 20)
    assertEquals(56.0, border[0], 0.0)
    assertEquals(34.0, border[1], 0.0)
    assertEquals(12.0, border[2], 0.0)
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

  // --- Data-returning analysis ops (executeData) ----------------------------

  /** Encode a real QR code carrying [text] as an upscaled base64 PNG. */
  private fun qrBase64(text: String): String {
    val encoder = QRCodeEncoder.create()
    val qr = Mat()
    encoder.encode(text, qr)
    assertTrue("failed to encode QR code", !qr.empty())
    val scaled = Mat()
    Imgproc.resize(qr, scaled, Size(), 8.0, 8.0, Imgproc.INTER_NEAREST)
    val buffer = MatOfByte()
    assertTrue("failed to encode QR image", Imgcodecs.imencode(".png", scaled, buffer))
    val bytes = buffer.toArray()
    buffer.release()
    scaled.release()
    qr.release()
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
  }

  @Test
  fun decodeQRDecodesEncodedValue() {
    val text = "https://opencv.org"
    val result = OpRegistry.executeData(
      """{"kind":"base64","value":"${qrBase64(text)}"}""",
      """[{"type":"decodeQR"}]""",
    )

    val parsed = JSONObject(result)
    assertTrue("expected QR to be found", parsed.getBoolean("found"))
    val codes = parsed.getJSONArray("codes")
    assertEquals(1, codes.length())
    val code = codes.getJSONObject(0)
    assertEquals(text, code.getString("value"))
    assertEquals(4, code.getJSONArray("corners").length())
  }

  @Test
  fun decodeQRRunsTransformsBeforeAnalysis() {
    val result = OpRegistry.executeData(
      """{"kind":"base64","value":"${qrBase64("GRAYTEST")}"}""",
      """[{"type":"gray"},{"type":"decodeQR"}]""",
    )

    val parsed = JSONObject(result)
    assertTrue("expected QR to be found", parsed.getBoolean("found"))
    assertEquals("GRAYTEST", parsed.getJSONArray("codes").getJSONObject(0).getString("value"))
  }

  @Test
  fun decodeQRReturnsNotFoundOnBlankImage() {
    val result = OpRegistry.executeData(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """[{"type":"decodeQR"}]""",
    )

    val parsed = JSONObject(result)
    assertEquals(false, parsed.getBoolean("found"))
    assertEquals(0, parsed.getJSONArray("codes").length())
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun dataPipelineWithNoOpsThrows() {
    OpRegistry.executeData(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """[]""",
    )
  }

  @Test(expected = OpenCVUnknownOpException::class)
  fun unknownAnalysisOpThrows() {
    OpRegistry.executeData(
      """{"kind":"base64","value":"${sourceBase64()}"}""",
      """[{"type":"notAnAnalysis"}]""",
    )
  }

  // --- Document scanning (scanDocument) -------------------------------------

  /**
   * Render a bright, convex quadrilateral "document" on a dark background and
   * return its file path. The quad is deliberately skewed so the perspective
   * correction has something to undo.
   */
  private fun writeDocumentImage(name: String): String {
    val canvas = Mat(240, 320, CvType.CV_8UC3, Scalar(15.0, 15.0, 15.0))
    val corners = MatOfPoint(
      Point(60.0, 30.0),
      Point(280.0, 55.0),
      Point(265.0, 210.0),
      Point(45.0, 195.0),
    )
    Imgproc.fillConvexPoly(canvas, corners, Scalar(235.0, 240.0, 245.0))
    val file = File(cacheDir, name)
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    corners.release()
    canvas.release()
    return file.absolutePath
  }

  @Test
  fun scanDocumentRectifiesDetectedQuad() {
    val input = writeDocumentImage("scan-in.png")
    val output = outputPath("scan-out.png")

    OpRegistry.execute(input, output, """[{"type":"scanDocument"}]""")

    val result = readResult(output)
    // The rectified document should be a sizable, non-trivial image.
    assertTrue("width should be substantial", result.cols() > 100)
    assertTrue("height should be substantial", result.rows() > 100)
    result.release()
  }

  @Test(expected = OpenCVDocumentNotFoundException::class)
  fun scanDocumentThrowsWhenNoDocument() {
    val input = writeSourceImage("scan-blank-in.png")
    val output = outputPath("scan-blank-out.png")

    OpRegistry.execute(input, output, """[{"type":"scanDocument"}]""")
  }

  @Test
  fun scanDocumentBwModeProducesBinaryImage() {
    val input = writeDocumentImage("scan-bw-in.png")
    val output = outputPath("scan-bw-out.png")

    OpRegistry.execute(input, output, """[{"type":"scanDocument","mode":"bw"}]""")

    val result = readResult(output)
    assertEquals("bw output should be single-channel", 1, result.channels())
    // Adaptive threshold yields a strictly black-or-white image.
    val buffer = ByteArray((result.total() * result.channels()).toInt())
    result.get(0, 0, buffer)
    assertTrue(
      "all pixels should be 0 or 255",
      buffer.all { it.toInt() and 0xFF == 0 || it.toInt() and 0xFF == 255 },
    )
    result.release()
  }

  @Test
  fun scanDocumentAspectRatioOverridesOutputSize() {
    val input = writeDocumentImage("scan-ar-in.png")
    val output = outputPath("scan-ar-out.png")

    OpRegistry.execute(input, output, """[{"type":"scanDocument","aspectRatio":2.0}]""")

    val result = readResult(output)
    val ratio = result.cols().toDouble() / result.rows().toDouble()
    assertEquals(2.0, ratio, 0.05)
    result.release()
  }

  // --- Document detection (detectDocument) ----------------------------------

  @Test
  fun detectDocumentReturnsFourOrderedCorners() {
    val input = writeDocumentImage("detect-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"detectDocument"}]""",
    )

    val parsed = JSONObject(result)
    assertTrue("expected a document to be found", parsed.getBoolean("found"))
    val corners = parsed.getJSONArray("corners")
    assertEquals(4, corners.length())
    assertEquals(320, parsed.getInt("width"))
    assertEquals(240, parsed.getInt("height"))
    // Corners are ordered tl, tr, br, bl: the top edge sits above the bottom.
    val tl = corners.getJSONObject(0)
    val br = corners.getJSONObject(2)
    assertTrue("top-left should be above-left of bottom-right", tl.getDouble("y") < br.getDouble("y"))
    assertTrue("top-left should be left of bottom-right", tl.getDouble("x") < br.getDouble("x"))
  }

  @Test
  fun detectDocumentReturnsNotFoundOnBlankImage() {
    val input = writeSourceImage("detect-blank-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"detectDocument"}]""",
    )

    val parsed = JSONObject(result)
    assertEquals(false, parsed.getBoolean("found"))
    assertEquals(0, parsed.getJSONArray("corners").length())
  }

  // --- Contour & shape analysis (findContours) ------------------------------

  /**
   * Render two filled white squares on a black background and return the path,
   * so contour detection has two distinct shapes to find.
   */
  private fun writeShapesImage(name: String): String {
    val canvas = Mat(240, 320, CvType.CV_8UC3, Scalar(0.0, 0.0, 0.0))
    Imgproc.rectangle(canvas, Point(20.0, 20.0), Point(120.0, 120.0), Scalar(255.0, 255.0, 255.0), -1)
    Imgproc.rectangle(canvas, Point(180.0, 60.0), Point(220.0, 100.0), Scalar(255.0, 255.0, 255.0), -1)
    val file = File(cacheDir, name)
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    canvas.release()
    return file.absolutePath
  }

  @Test
  fun findContoursReturnsShapesLargestFirst() {
    val input = writeShapesImage("contours-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"findContours","mode":"external","minArea":0.0,"epsilon":0.0}]""",
    )

    val parsed = JSONObject(result)
    assertTrue(parsed.getBoolean("found"))
    assertEquals(2, parsed.getInt("count"))
    assertEquals(320, parsed.getInt("width"))
    assertEquals(240, parsed.getInt("height"))
    val contours = parsed.getJSONArray("contours")
    val first = contours.getJSONObject(0)
    val second = contours.getJSONObject(1)
    assertTrue("largest contour first", first.getDouble("area") >= second.getDouble("area"))
    val box = first.getJSONObject("boundingBox")
    assertTrue("bounding box has width", box.getInt("width") > 50)
    assertTrue("min-area rect present", first.getJSONObject("minAreaRect").has("angle"))
    assertTrue("has points", first.getJSONArray("points").length() >= 4)
  }

  @Test
  fun findContoursMinAreaFiltersSmallShapes() {
    val input = writeShapesImage("contours-filter-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"findContours","mode":"external","minArea":5000.0,"epsilon":0.0}]""",
    )

    val parsed = JSONObject(result)
    assertEquals("only the large square survives", 1, parsed.getInt("count"))
  }

  @Test
  fun findContoursReturnsNotFoundOnBlankImage() {
    val canvas = Mat(120, 160, CvType.CV_8UC1, Scalar(0.0))
    val file = File(cacheDir, "contours-black.png")
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    canvas.release()

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"${file.absolutePath}"}""",
      """[{"type":"findContours","mode":"list","minArea":0.0,"epsilon":0.02}]""",
    )

    val parsed = JSONObject(result)
    assertEquals(false, parsed.getBoolean("found"))
    assertEquals(0, parsed.getInt("count"))
  }

  // --- connectedComponents ---------------------------------------------------

  @Test
  fun connectedComponentsCountsBlobsLargestFirst() {
    val input = writeShapesImage("cc-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"connectedComponents","connectivity":8,"minArea":0.0}]""",
    )

    val parsed = JSONObject(result)
    assertTrue(parsed.getBoolean("found"))
    assertEquals(2, parsed.getInt("count"))
    val comps = parsed.getJSONArray("components")
    val first = comps.getJSONObject(0)
    val second = comps.getJSONObject(1)
    assertTrue(first.getDouble("area") >= second.getDouble("area"))
    assertTrue(first.getJSONObject("boundingBox").getInt("width") > 50)
    assertTrue(first.getJSONObject("centroid").has("x"))
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun connectedComponentsRejectsBadConnectivity() {
    val input = writeShapesImage("cc-bad.png")
    OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"connectedComponents","connectivity":7}]""",
    )
  }

  // --- houghLines & houghCircles --------------------------------------------

  @Test
  fun houghLinesFindsStraightEdges() {
    val canvas = Mat(200, 200, CvType.CV_8UC1, Scalar(0.0))
    Imgproc.line(canvas, Point(10.0, 100.0), Point(190.0, 100.0), Scalar(255.0), 2)
    val file = File(cacheDir, "hl-in.png")
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    canvas.release()

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"${file.absolutePath}"}""",
      """[{"type":"houghLines","rho":1.0,"theta":${Math.PI / 180},"threshold":50,"minLineLength":80.0,"maxLineGap":10.0}]""",
    )

    val parsed = JSONObject(result)
    assertTrue(parsed.getBoolean("found"))
    assertTrue(parsed.getInt("count") >= 1)
    assertTrue(parsed.getJSONArray("lines").getJSONObject(0).has("x1"))
  }

  @Test
  fun houghCirclesFindsDrawnCircle() {
    val canvas = Mat(200, 200, CvType.CV_8UC1, Scalar(0.0))
    Imgproc.circle(canvas, Point(100.0, 100.0), 40, Scalar(255.0), 2)
    val file = File(cacheDir, "hc-in.png")
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    canvas.release()

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"${file.absolutePath}"}""",
      """[{"type":"houghCircles","dp":1.0,"minDist":20.0,"param1":100.0,"param2":20.0,"minRadius":20,"maxRadius":60}]""",
    )

    val parsed = JSONObject(result)
    assertEquals(200, parsed.getInt("width"))
    assertTrue(parsed.getInt("count") >= 1)
  }

  // --- dominantColors --------------------------------------------------------

  @Test
  fun dominantColorsReturnsPaletteByPopulation() {
    // Top half blue, bottom half red (BGR) — two clear dominant colors.
    val canvas = Mat(60, 40, CvType.CV_8UC3, Scalar(0.0, 0.0, 255.0))
    Imgproc.rectangle(canvas, Point(0.0, 0.0), Point(40.0, 30.0), Scalar(255.0, 0.0, 0.0), -1)
    val file = File(cacheDir, "dom-in.png")
    assertTrue(Imgcodecs.imwrite(file.absolutePath, canvas))
    canvas.release()

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"${file.absolutePath}"}""",
      """[{"type":"dominantColors","k":2,"attempts":3,"iterations":10}]""",
    )

    val parsed = JSONObject(result)
    assertEquals(2, parsed.getInt("count"))
    val colors = parsed.getJSONArray("colors")
    assertEquals(2, colors.length())
    val first = colors.getJSONObject(0)
    val second = colors.getJSONObject(1)
    assertTrue("most-dominant first", first.getInt("population") >= second.getInt("population"))
    assertEquals(1.0, first.getDouble("fraction") + second.getDouble("fraction"), 0.001)
    val hex = first.getString("hex")
    assertEquals(7, hex.length)
    assertTrue(hex.startsWith("#"))
    var hasRed = false
    var hasBlue = false
    for (i in 0 until colors.length()) {
      val c = colors.getJSONObject(i).getJSONObject("color")
      val r = c.getInt("r")
      val g = c.getInt("g")
      val b = c.getInt("b")
      if (r > 200 && g < 60 && b < 60) hasRed = true
      if (b > 200 && g < 60 && r < 60) hasBlue = true
    }
    assertTrue("palette has red and blue", hasRed && hasBlue)
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun dominantColorsRejectsBadK() {
    val input = writeSourceImage("dom-bad.png")
    OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"dominantColors","k":0}]""",
    )
  }

  // --- goodFeaturesToTrack ---------------------------------------------------

  @Test
  fun goodFeaturesToTrackFindsSquareCorners() {
    val input = writeShapesImage("gftt-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"goodFeaturesToTrack","maxCorners":100,"qualityLevel":0.01,"minDistance":10.0,"blockSize":3,"useHarrisDetector":false,"k":0.04}]""",
    )

    val parsed = JSONObject(result)
    assertTrue(parsed.getBoolean("found"))
    assertTrue("at least the square's 4 corners", parsed.getInt("count") >= 4)
    assertEquals(320, parsed.getInt("width"))
    assertEquals(240, parsed.getInt("height"))
    val first = parsed.getJSONArray("corners").getJSONObject(0)
    assertTrue(first.has("x"))
    assertTrue(first.has("y"))
  }

  @Test
  fun goodFeaturesToTrackHarrisDetectorFindsCorners() {
    val input = writeShapesImage("gftt-harris-in.png")

    val result = OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"goodFeaturesToTrack","useHarrisDetector":true}]""",
    )

    val parsed = JSONObject(result)
    assertTrue(parsed.getInt("count") >= 1)
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun goodFeaturesToTrackRejectsBadQuality() {
    val input = writeSourceImage("gftt-bad.png")
    OpRegistry.executeData(
      """{"kind":"path","value":"$input"}""",
      """[{"type":"goodFeaturesToTrack","qualityLevel":0.0}]""",
    )
  }

  // --- boundingRect / minAreaRect / approxPolyDP ----------------------------

  @Test
  fun boundingRectAndMinAreaRectUseLargestContour() {
    val input = writeShapesImage("br-in.png")

    val box = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"boundingRect"}]""",
      ),
    )
    assertTrue(box.getBoolean("found"))
    assertTrue(box.getJSONObject("boundingBox").getInt("width") > 50)

    val rr = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"minAreaRect"}]""",
      ),
    )
    assertTrue(rr.getBoolean("found"))
    assertTrue(rr.getJSONObject("minAreaRect").has("angle"))
  }

  @Test
  fun approxPolyDPSimplifiesToCorners() {
    val input = writeShapesImage("approx-in.png")

    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"approxPolyDP","epsilon":0.05,"closed":true}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    assertEquals("a square reduces to 4 corners", 4, parsed.getJSONArray("points").length())
  }

  @Test
  fun boundingRectAcceptsExplicitPoints() {
    val input = writeShapesImage("br-pts-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"boundingRect","points":[[10,10],[60,10],[60,40],[10,40]]}]""",
      ),
    )
    val box = parsed.getJSONObject("boundingBox")
    assertEquals(51, box.getInt("width"))
    assertEquals(31, box.getInt("height"))
  }

  // --- Geometric & photometric ops ---------------------------------------

  @Test
  fun warpPerspectiveIdentityPreservesImage() {
    val input = writeSourceImage("warpp-in.png")
    val output = outputPath("warpp-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"warpPerspective","srcPoints":[[0,0],[40,0],[40,60],[0,60]],"dstPoints":[[0,0],[40,0],[40,60],[0,60]],"width":40,"height":60}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(30, 20)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun warpPerspectiveWrongPointCountThrows() {
    val input = writeSourceImage("warpp-bad-in.png")
    val output = outputPath("warpp-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"warpPerspective","srcPoints":[[0,0],[40,0],[40,60]],"dstPoints":[[0,0],[40,0],[40,60]]}]""",
    )
  }

  @Test
  fun warpAffineIdentityPreservesImage() {
    val input = writeSourceImage("warpa-in.png")
    val output = outputPath("warpa-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"warpAffine","srcPoints":[[0,0],[40,0],[0,60]],"dstPoints":[[0,0],[40,0],[0,60]],"width":40,"height":60}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(30, 20)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun blendWithIdenticalSourcePreservesImage() {
    val input = writeSourceImage("blend-in.png")
    val output = outputPath("blend-out.png")
    val source = sourceBase64()

    OpRegistry.execute(
      input,
      output,
      """[{"type":"blend","source":"$source","alpha":0.5,"beta":0.5,"gamma":0}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    // 0.5 * (10,20,30) + 0.5 * (10,20,30) == (10,20,30).
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun equalizeHistProducesSingleChannelImage() {
    val input = writeSourceImage("equalize-in.png")
    val output = outputPath("equalize-out.png")

    OpRegistry.execute(input, output, """[{"type":"equalizeHist"}]""")

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun claheProducesSingleChannelImage() {
    val input = writeSourceImage("clahe-in.png")
    val output = outputPath("clahe-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"clahe","clipLimit":2,"tileGridSize":8}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun bilateralFilterPreservesShape() {
    val input = writeSourceImage("bilateral-in.png")
    val output = outputPath("bilateral-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"bilateralFilter","diameter":5,"sigmaColor":50,"sigmaSpace":50}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // A uniform region is unchanged by edge-preserving smoothing.
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun copyMakeBorderEnlargesImage() {
    val input = writeSourceImage("border-in.png")
    val output = outputPath("border-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"copyMakeBorder","top":5,"bottom":5,"left":5,"right":5,"borderType":"constant","color":[0,0,0]}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH + 10, result.cols())
    assertEquals(HEIGHT + 10, result.rows())
    // The constant border is black; the inner region keeps the source pixel.
    val border = result.get(0, 0)
    assertEquals(0.0, border[0], 0.0)
    assertEquals(0.0, border[1], 0.0)
    assertEquals(0.0, border[2], 0.0)
    val inner = result.get(30, 25)
    assertEquals(10.0, inner[0], 0.0)
    assertEquals(20.0, inner[1], 0.0)
    assertEquals(30.0, inner[2], 0.0)
    result.release()
  }

  @Test
  fun normalizePreservesShape() {
    val input = writeSourceImage("normalize-in.png")
    val output = outputPath("normalize-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"normalize","alpha":0,"beta":255,"normType":"minmax"}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun convertScaleAbsScalesPixelValues() {
    val input = writeSourceImage("convert-in.png")
    val output = outputPath("convert-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"convertScaleAbs","alpha":2,"beta":0}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    // |2 * (10,20,30) + 0| == (20,40,60).
    val pixel = result.get(0, 0)
    assertEquals(20.0, pixel[0], 0.0)
    assertEquals(40.0, pixel[1], 0.0)
    assertEquals(60.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun lutAppliesInverseTable() {
    val input = writeSourceImage("lut-in.png")
    val output = outputPath("lut-out.png")
    val table = (0..255).joinToString(",") { (255 - it).toString() }

    OpRegistry.execute(input, output, """[{"type":"lut","table":[$table]}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    // table[x] = 255 - x maps (10,20,30) -> (245,235,225).
    val pixel = result.get(0, 0)
    assertEquals(245.0, pixel[0], 0.0)
    assertEquals(235.0, pixel[1], 0.0)
    assertEquals(225.0, pixel[2], 0.0)
    result.release()
  }

  // --- Gradient ops ------------------------------------------------------

  @Test
  fun sobelOnUniformImageProducesZeros() {
    val input = writeSourceImage("sobel-in.png")
    val output = outputPath("sobel-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"sobel","dx":1,"dy":0,"ksize":3,"scale":1,"delta":0}]""",
    )

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // A flat image has no gradient, so the absolute derivative is zero.
    val pixel = result.get(30, 20)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(0.0, pixel[1], 0.0)
    assertEquals(0.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun sobelEvenKsizeThrows() {
    val input = writeSourceImage("sobel-bad-in.png")
    val output = outputPath("sobel-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"sobel","dx":1,"dy":0,"ksize":4}]""",
    )
  }

  @Test
  fun scharrOnUniformImageProducesZeros() {
    val input = writeSourceImage("scharr-in.png")
    val output = outputPath("scharr-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"scharr","dx":0,"dy":1,"scale":1,"delta":0}]""",
    )

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(30, 20)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(0.0, pixel[1], 0.0)
    assertEquals(0.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun scharrInvalidDerivativeOrderThrows() {
    val input = writeSourceImage("scharr-bad-in.png")
    val output = outputPath("scharr-bad-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"scharr","dx":1,"dy":1}]""",
    )
  }

  @Test
  fun laplacianOnUniformImageProducesZeros() {
    val input = writeSourceImage("laplacian-in.png")
    val output = outputPath("laplacian-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"laplacian","ksize":3,"scale":1,"delta":0}]""",
    )

    val result = readResult(output)
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(30, 20)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(0.0, pixel[1], 0.0)
    assertEquals(0.0, pixel[2], 0.0)
    result.release()
  }

  @Test
  fun sepFilter2DOnUniformImageWithZeroSumKernel() {
    val input = writeSourceImage("sep-in.png")
    val output = outputPath("sep-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"sepFilter2D","kernelX":[1,0,-1],"kernelY":[1,2,1],"delta":0}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    // kernelX = [1,0,-1] sums to zero, so a flat image yields zeros.
    val pixel = result.get(30, 20)
    assertEquals(0.0, pixel[0], 0.0)
    assertEquals(0.0, pixel[1], 0.0)
    assertEquals(0.0, pixel[2], 0.0)
    result.release()
  }

  // --- Contour-metric data ops ------------------------------------------

  @Test
  fun contourAreaMeasuresLargestContour() {
    val input = writeShapesImage("area-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"contourArea"}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    // The 100x100 filled rectangle dominates the smaller one.
    assertTrue(parsed.getDouble("area") > 5000.0)
    assertTrue(parsed.getInt("width") > 50)
  }

  @Test
  fun arcLengthMeasuresPerimeter() {
    val input = writeShapesImage("arc-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"arcLength","closed":true}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    assertTrue(parsed.getDouble("length") > 100.0)
  }

  @Test
  fun arcLengthAcceptsExplicitOpenPolyline() {
    val input = writeShapesImage("arc-pts-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"arcLength","closed":false,"points":[[0,0],[30,0],[30,40]]}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    // 30 + 40 == 70 for an open polyline.
    assertEquals(70.0, parsed.getDouble("length"), 0.001)
  }

  @Test
  fun convexHullReturnsHullPoints() {
    val input = writeShapesImage("hull-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"convexHull"}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    val hull = parsed.getJSONArray("hull")
    assertTrue(hull.length() >= 4)
    assertTrue(hull.getJSONObject(0).has("x"))
  }

  @Test
  fun fitEllipseReturnsEllipseForContour() {
    val input = writeShapesImage("ellipse-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        // fitEllipse needs >= 5 points; a CHAIN_APPROX rectangle only has 4,
        // so supply explicit points.
        """[{"type":"fitEllipse","points":[[10,10],[60,12],[64,40],[40,64],[8,40]]}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    val ellipse = parsed.getJSONObject("ellipse")
    assertTrue(ellipse.has("centerX"))
    assertTrue(ellipse.getDouble("width") > 0.0)
  }

  @Test
  fun fitLineReturnsDirectionAndPoint() {
    val input = writeShapesImage("line-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"fitLine"}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    assertTrue(parsed.getJSONObject("line").has("vx"))
  }

  // --- Image-statistics data ops ----------------------------------------

  @Test
  fun meanStdDevOnUniformImageHasZeroSpread() {
    val input = writeSourceImage("mean-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"meanStdDev"}]""",
      ),
    )
    assertEquals(3, parsed.getInt("channels"))
    val stddev = parsed.getJSONArray("stddev")
    assertEquals(0.0, stddev.getDouble(0), 0.001)
  }

  @Test
  fun minMaxLocOnUniformImageHasEqualExtremes() {
    val input = writeSourceImage("minmax-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"minMaxLoc"}]""",
      ),
    )
    assertEquals(parsed.getDouble("min"), parsed.getDouble("max"), 0.001)
    assertTrue(parsed.getJSONObject("maxLoc").has("x"))
  }

  @Test
  fun countNonZeroReportsRatio() {
    val input = writeShapesImage("nonzero-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"countNonZero"}]""",
      ),
    )
    assertTrue(parsed.getInt("count") > 0)
    val ratio = parsed.getDouble("ratio")
    assertTrue(ratio > 0.0 && ratio < 1.0)
  }

  @Test
  fun calcHistDefaultsToFullRange() {
    val input = writeSourceImage("hist-in.png")
    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$input"}""",
        """[{"type":"calcHist","bins":256,"channel":0}]""",
      ),
    )
    assertEquals(256, parsed.getInt("bins"))
    assertEquals(256, parsed.getJSONArray("histogram").length())
  }

  // --- Template matching -------------------------------------------------

  @Test
  fun matchTemplateLocatesPattern() {
    val scene = writeShapesImage("tmpl-scene.png")
    val template = Mat(60, 60, CvType.CV_8UC3, Scalar(0.0, 0.0, 0.0))
    Imgproc.rectangle(template, Point(0.0, 0.0), Point(40.0, 40.0), Scalar(255.0, 255.0, 255.0), -1)
    val templateFile = File(cacheDir, "tmpl-patch.png")
    assertTrue(Imgcodecs.imwrite(templateFile.absolutePath, template))
    template.release()

    val parsed = JSONObject(
      OpRegistry.executeData(
        """{"kind":"path","value":"$scene"}""",
        """[{"type":"matchTemplate","template":"${templateFile.absolutePath}","method":"ccoeffNormed"}]""",
      ),
    )
    assertTrue(parsed.getBoolean("found"))
    assertEquals(60, parsed.getInt("templateWidth"))
    assertTrue(parsed.getJSONObject("location").has("x"))
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun matchTemplateRejectsMissingTemplate() {
    val scene = writeShapesImage("tmpl-bad-scene.png")
    OpRegistry.executeData(
      """{"kind":"path","value":"$scene"}""",
      """[{"type":"matchTemplate","template":""}]""",
    )
  }

  // --- Segmentation transform ops ---------------------------------------

  @Test
  fun distanceTransformProducesSingleChannel() {
    val input = writeShapesImage("dist-in.png")
    val output = outputPath("dist-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"distanceTransform","distanceType":"L2","maskSize":3,"normalize":true}]""",
    )

    val result = readResult(output)
    assertEquals(1, result.channels())
    assertEquals(320, result.cols())
    assertEquals(240, result.rows())
    result.release()
  }

  @Test
  fun kmeansQuantizesColors() {
    val input = writeSourceImage("kmeans-in.png")
    val output = outputPath("kmeans-out.png")

    OpRegistry.execute(input, output, """[{"type":"kmeans","k":2,"attempts":1,"iterations":5}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    result.release()
  }

  @Test
  fun grabCutPreservesDimensions() {
    val input = writeShapesImage("grabcut-in.png")
    val output = outputPath("grabcut-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"grabCut","rect":{"x":20,"y":20,"width":100,"height":100},"iterations":2}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(320, result.cols())
    assertEquals(240, result.rows())
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun grabCutRejectsMissingRect() {
    val input = writeShapesImage("grabcut-bad-in.png")
    val output = outputPath("grabcut-bad-out.png")
    OpRegistry.execute(input, output, """[{"type":"grabCut"}]""")
  }

  @Test
  fun watershedPreservesDimensions() {
    val input = writeShapesImage("watershed-in.png")
    val output = outputPath("watershed-out.png")

    OpRegistry.execute(input, output, """[{"type":"watershed","lineColor":[255,0,0]}]""")

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(320, result.cols())
    assertEquals(240, result.rows())
    result.release()
  }

  // --- Ergonomic transform ops ------------------------------------------

  @Test
  fun drawContoursOutlinesShapes() {
    val input = writeShapesImage("draw-in.png")
    val output = outputPath("draw-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"drawContours","color":[0,255,0],"thickness":2,"minArea":0,"antialias":true}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(320, result.cols())
    assertEquals(240, result.rows())
    result.release()
  }

  @Test
  fun fourPointTransformIdentityPreservesImage() {
    val input = writeSourceImage("fpt-in.png")
    val output = outputPath("fpt-out.png")

    OpRegistry.execute(
      input,
      output,
      """[{"type":"fourPointTransform","points":[[0,0],[39,0],[39,59],[0,59]],"width":40,"height":60}]""",
    )

    val result = readResult(output)
    assertEquals(3, result.channels())
    assertEquals(WIDTH, result.cols())
    assertEquals(HEIGHT, result.rows())
    val pixel = result.get(0, 0)
    assertEquals(10.0, pixel[0], 0.0)
    assertEquals(20.0, pixel[1], 0.0)
    assertEquals(30.0, pixel[2], 0.0)
    result.release()
  }

  @Test(expected = OpenCVInvalidArgumentException::class)
  fun fourPointTransformRejectsTooFewPoints() {
    val input = writeSourceImage("fpt-bad-in.png")
    val output = outputPath("fpt-bad-out.png")
    OpRegistry.execute(
      input,
      output,
      """[{"type":"fourPointTransform","points":[[0,0],[39,0],[39,59]]}]""",
    )
  }
}
