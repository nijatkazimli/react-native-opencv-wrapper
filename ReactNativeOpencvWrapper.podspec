require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
opencv_cfg = (package["reactNativeOpenCV"] || {})

# ---------------------------------------------------------------------------
# OpenCV bundling strategy
# ---------------------------------------------------------------------------
# This wrapper depends on OpenCV at link time. We support two modes:
#
#   1. "bundled" (default) - We declare a CocoaPods dependency on a prebuilt
#      OpenCV pod (default: `OpenCV-Dynamic-Framework`, which ships an
#      xcframework built from opencv.org sources and is kept up to date with
#      the 4.x line). The host app does not have to do anything.
#
#   2. "host"   - The host app already provides OpenCV (e.g. via another pod
#      such as `OpenCV`, `react-native-vision-camera`, or a hand-vendored
#      xcframework). In this case we skip declaring the dependency and just
#      link against whatever symbols the host already exposes.
#
# Selection (in order of precedence):
#   * Environment variable  RN_OPENCV_MODE  = "bundled" | "host"
#   * package.json field    reactNativeOpenCV.mode
#   * Auto-detect: if the host Podfile already declares a pod whose name
#     starts with "OpenCV", switch to "host". Otherwise use "bundled".
#
# Pod name + version can be overridden too:
#   * RN_OPENCV_POD     / reactNativeOpenCV.pod
#   * RN_OPENCV_VERSION / reactNativeOpenCV.version
# ---------------------------------------------------------------------------

DEFAULT_OPENCV_POD     = "OpenCV"
DEFAULT_OPENCV_VERSION = "~> 4.3.0"

resolve_opencv_mode = lambda do |cfg|
  return ENV["RN_OPENCV_MODE"] if ENV["RN_OPENCV_MODE"] && !ENV["RN_OPENCV_MODE"].empty?
  return cfg["mode"]           if cfg["mode"]

  podfile = (Pod::Config.instance.podfile rescue nil)
  if podfile
    host_provides = podfile.dependencies.any? { |d| d.name.to_s.start_with?("OpenCV") }
    return "host" if host_provides
  end

  "bundled"
end

mode           = resolve_opencv_mode.call(opencv_cfg)
opencv_pod     = ENV["RN_OPENCV_POD"]     || opencv_cfg["pod"]     || DEFAULT_OPENCV_POD
opencv_version = ENV["RN_OPENCV_VERSION"] || opencv_cfg["version"] || DEFAULT_OPENCV_VERSION

# Only print when CocoaPods has loaded the host Podfile (otherwise
# auto-detect can't see the host's pods and we'd announce a tentative
# mode that may flip on a later evaluation). If the user explicitly
# forced a mode via env var or package.json, print right away.
forced = !ENV["RN_OPENCV_MODE"].to_s.empty? || !opencv_cfg["mode"].nil?
podfile_ready = !(Pod::Config.instance.podfile rescue nil).nil?
if forced || podfile_ready
  Pod::UI.puts "[react-native-opencv-wrapper] OpenCV mode: #{mode} (pod: #{opencv_pod} #{opencv_version})"
end

Pod::Spec.new do |s|
  s.name         = "ReactNativeOpencvWrapper"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/nijatkazimli/react-native-opencv-wrapper.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"
  # Test sources live under ios/Tests and are compiled by the test_spec below,
  # not as part of the shipped library.
  s.exclude_files = "ios/Tests/**/*"

  # OpenCV uses C++17 features.
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "CLANG_CXX_LIBRARY"           => "libc++"
  }

  # Each op self-registers from a `+load` in its own translation unit. When the
  # pod is linked as a static library, the linker drops these otherwise
  # unreferenced object files, so `+load` never runs and ops fail with
  # "unknown pipeline op type". `-ObjC` force-loads every object file that
  # defines an Objective-C class, ensuring all ops register.
  s.user_target_xcconfig = {
    "OTHER_LDFLAGS" => "-ObjC"
  }

  if mode == "bundled"
    s.dependency opencv_pod, opencv_version
  end

  # XCTest suite that exercises the registry against the real OpenCV library.
  # `-ObjC` is required so each op's `+load` self-registration runs in the test
  # binary, mirroring the host-app linker flag above.
  s.test_spec "Tests" do |test|
    test.source_files = "ios/Tests/**/*.{m,mm}"
    test.requires_app_host = false
    test.pod_target_xcconfig = {
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
      "CLANG_CXX_LIBRARY"           => "libc++",
      "OTHER_LDFLAGS"               => "-ObjC"
    }
  end

  install_modules_dependencies(s)
end
