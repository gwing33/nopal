import { useMemo } from "react";
import type { Frame } from "../../hooks/useFrames";
import { framesToGeometry } from "../../hooks/useFrames";
import { VisualPreviewer } from "./VisualPreviewer";

interface FramesVisualPreviewProps {
  frames: Frame[];
}

export function FramesVisualPreview({ frames }: FramesVisualPreviewProps) {
  const geo = useMemo(() => framesToGeometry(frames), [frames]);

  if (frames.length < 2) {
    return null;
  }

  return <VisualPreviewer geometry={geo} />;
}

// ── Fallback 2D preview (when WebGPU is unavailable) ────────────────────────

export function Fallback2DPreview({ frames }: { frames: Frame[] }) {
  if (frames.length < 2) {
    return null;
  }

  const maxHeight = Math.max(...frames.map((f) => f.width));
  const maxDepth = Math.max(...frames.map((f) => f.depth));

  return (
    <div className="mt-8 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Visual Preview</h3>
      <p className="text-xs opacity-50 mb-2">
        WebGPU is not available — showing 2D fallback.
      </p>
      <div className="flex items-end gap-2 overflow-x-auto pb-4">
        {frames.map((frame, index) => {
          const scaledHeight =
            maxHeight > 0 ? (frame.width / maxHeight) * 100 : 30;
          const scaledWidth =
            maxDepth > 0 ? Math.max(20, (frame.depth / maxDepth) * 60) : 30;

          return (
            <div key={frame.id} className="flex items-end">
              <div className="flex flex-col items-center">
                <div
                  className="bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-400 flex items-center justify-center text-xs font-bold text-white rounded-sm"
                  style={{
                    height: `${Math.max(30, scaledHeight)}px`,
                    width: `${scaledWidth}px`,
                    minWidth: "30px",
                  }}
                >
                  {index + 1}
                </div>
              </div>
              {index < frames.length - 1 && (
                <div className="flex flex-col items-center mx-1">
                  <div
                    className="bg-purple-300 dark:bg-purple-700 opacity-50"
                    style={{
                      height: "4px",
                      width: `${Math.max(30, frame.distanceToNext * 10)}px`,
                    }}
                  />
                  <span className="text-xs mt-1">
                    {frame.distanceToNext}&apos;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm opacity-70 mt-2">
        Frame heights and widths are scaled proportionally. Numbers indicate
        frame index.
      </p>
    </div>
  );
}
