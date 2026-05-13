require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
opencv_cfg = (package["reactNativeOpenCV"] || {})

# ---------------------------------------------------------------------------
# OpenCV bundling strategy
# ---------------------------------------------------------------------------
# This wrapper depends on OpenCV at link time. We support two modes:
#
#   1. "bundled" (default) - We declare a CocoaPods dependency on the official
#      `OpenCV` pod (which ships the prebuilt opencv2.framework from
#      opencv.org). The host app does not have to do anything.
#
#   2. "host"   - The host app already provides OpenCV (e.g. via another pod
#      such as `OpenCV2`, `react-native-vision-camera`, or a hand-vendored
#      framework). In this case we skip declaring the dependency and just
#      link against whatever symbols the host already exposes.
#
# Selection (in order of precedence):
#   * Environment variable  RN_OPENCV_MODE = "bundled" | "host"
#   * package.json field    reactNativeOpenCV.mode
#   * Auto-detect: if the host Podfile already declares a pod whose name
#     starts with "OpenCV", switch to "host". Otherwise use "bundled".
#
# You can pin the OpenCV version with RN_OPENCV_VERSION or
# `reactNativeOpenCV.version` in package.json (default below).
# ---------------------------------------------------------------------------

DEFAULT_OPENCV_VERSION = "~> 4.10"

def rn_opencv_mode(opencv_cfg)
  return ENV["RN_OPENCV_MODE"] if ENV["RN_OPENCV_MODE"] && !ENV["RN_OPENCV_MODE"].empty?
  return opencv_cfg["mode"]    if opencv_cfg["mode"]

  podfile = Pod::Config.instance.podfile rescue nil
  if podfile
    host_provides = podfile.dependencies.any? { |d| d.name.to_s.start_with?("OpenCV") }
    return "host" if host_provides
  end

  "bundled"
end

mode = rn_opencv_mode(opencv_cfg)
opencv_version = ENV["RN_OPENCV_VERSION"] || opencv_cfg["version"] || DEFAULT_OPENCV_VERSION

Pod::UI.puts "[react-native-opencv-wrapper] OpenCV mode: #{mode}" rescue nil

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

  # OpenCV uses C++17 features.
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "CLANG_CXX_LIBRARY"           => "libc++"
  }

  if mode == "bundled"
    s.dependency "OpenCV", opencv_version
  end

  install_modules_dependencies(s)
end
