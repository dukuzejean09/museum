/**
 * Detection bounding box overlay — shown when YOLO detects an object.
 * Renders a colored rectangle over the camera feed at the detected position.
 */
const DetectionBox = ({ bbox, label, confidence, videoWidth, videoHeight, containerWidth, containerHeight }) => {
  if (!bbox || !videoWidth || !videoHeight) return null;

  // Scale bbox coordinates from video dimensions to container dimensions
  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  const [x1, y1, x2, y2] = bbox;
  const left = x1 * scaleX;
  const top = y1 * scaleY;
  const width = (x2 - x1) * scaleX;
  const height = (y2 - y1) * scaleY;

  const confidencePercent = Math.round(confidence * 100);

  return (
    <div
      className="absolute border-2 border-amber-400 rounded-lg pointer-events-none z-10"
      style={{ left, top, width, height }}
    >
      {label && (
        <span className="absolute -top-6 left-0 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
          {label} {confidencePercent}%
        </span>
      )}
      {/* Corner accents */}
      <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-amber-400 rounded-tl" />
      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-amber-400 rounded-tr" />
      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-amber-400 rounded-bl" />
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-amber-400 rounded-br" />
    </div>
  );
};

export default DetectionBox;
