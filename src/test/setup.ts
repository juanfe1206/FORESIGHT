import "@testing-library/jest-dom/vitest";

/* jsdom: SVGGeometryElement path sampling (used by FlowView particles). */
if (typeof SVGPathElement !== "undefined") {
  if (!SVGPathElement.prototype.getTotalLength) {
    SVGPathElement.prototype.getTotalLength = function getTotalLength() {
      return 320;
    };
  }
  if (!SVGPathElement.prototype.getPointAtLength) {
    SVGPathElement.prototype.getPointAtLength = function getPointAtLength(distance: number) {
      const t = (distance % 320) / 320;
      return new DOMPoint(60 + t * 200, 64 + t * 198);
    };
  }
}
