// Registry of all pipeline ops. Importing this module installs every op's
// fluent method on `Pipeline` (side effect) and re-exports its public param
// types. Adding a new op = create `./<op>.ts` and add one line here; the
// orchestrator in `../core/pipeline` never changes.

export * from "./gray";
export * from "./gaussianBlur";
export * from "./canny";
export * from "./resize";
export * from "./crop";
export * from "./rotate";
export * from "./flip";
export * from "./threshold";
export * from "./medianBlur";
export * from "./dilate";
export * from "./erode";
export * from "./cvtColor";
export * from "./inRange";
export * from "./filter2D";
export * from "./adaptiveThreshold";
export * from "./morphologyEx";
export * from "./bitwiseNot";
export * from "./applyMask";
export * from "./drawRect";
export * from "./drawCircle";
export * from "./drawLine";
export * from "./putText";
export * from "./drawPolygon";
export * from "./warpPerspective";
export * from "./warpAffine";
export * from "./blend";
export * from "./equalizeHist";
export * from "./clahe";
export * from "./bilateralFilter";
export * from "./copyMakeBorder";
export * from "./normalize";
export * from "./convertScaleAbs";
export * from "./lut";
export * from "./sobel";
export * from "./scharr";
export * from "./laplacian";
export * from "./sepFilter2D";
export * from "./debug";
export * from "./decodeQR";
export * from "./detectDocument";
export * from "./scanDocument";
export * from "./findContours";
