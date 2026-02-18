import { useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "Volume Calculator by Frames | Nopal Tools" },
  {
    name: "description",
    content: "Calculate backfill volumes for construction using frame slices",
  },
];

interface Frame {
  id: number;
  height: number; // in inches
  depth: number; // in inches
  distanceToNext: number; // in feet
}

interface Material {
  id: string;
  name: string;
  description: string;
  lbsPerCubicFoot: number; // density in pounds per cubic foot
}

const MATERIALS: Material[] = [
  {
    id: "ab",
    name: "Aggregate Base (AB)",
    description: "Compacted road base material",
    lbsPerCubicFoot: 115,
  },
  {
    id: "quarter-minus",
    name: '1/4" Minus Rock',
    description: "Fine crushed material, compacts well",
    lbsPerCubicFoot: 100,
  },
  {
    id: "pea-gravel",
    name: "Pea Gravel",
    description: '1/8" - 3/8" rounded stones',
    lbsPerCubicFoot: 96,
  },
  {
    id: "crushed-stone",
    name: "Crushed Stone",
    description: '1/2" - 3/4" angular aggregate',
    lbsPerCubicFoot: 100,
  },
  {
    id: "river-rock",
    name: "River Rock",
    description: '1" - 3" smooth rounded stones',
    lbsPerCubicFoot: 90,
  },
  {
    id: "riprap",
    name: "Riprap",
    description: "Large angular stones for erosion control",
    lbsPerCubicFoot: 85,
  },
  {
    id: "sand",
    name: "Sand",
    description: "Fine granular material",
    lbsPerCubicFoot: 100,
  },
  {
    id: "dirt",
    name: "Dirt",
    description: "General fill dirt/soil",
    lbsPerCubicFoot: 75,
  },
  {
    id: "concrete",
    name: "Concrete",
    description: "Mixed concrete",
    lbsPerCubicFoot: 150,
  },
];

function formatVolume(cubicInches: number): {
  cubicFeet: number;
  cubicYards: number;
  cubicFeetStr: string;
  cubicYardsStr: string;
} {
  const cubicFeet = cubicInches / 1728; // 12^3
  const cubicYards = cubicFeet / 27; // 3^3
  return {
    cubicFeet,
    cubicYards,
    cubicFeetStr: cubicFeet.toFixed(2),
    cubicYardsStr: cubicYards.toFixed(2),
  };
}

function formatWeight(pounds: number): {
  pounds: string;
  tons: string;
} {
  return {
    pounds: pounds.toFixed(0),
    tons: (pounds / 2000).toFixed(2),
  };
}

function calculateSegmentVolume(
  frame1: Frame,
  frame2: Frame,
  distance: number
): number {
  const area1 = frame1.height * frame1.depth;
  const area2 = frame2.height * frame2.depth;
  const avgArea = (area1 + area2) / 2;
  const distanceInches = distance * 12;
  return avgArea * distanceInches;
}

export default function FramesVolumeCalc() {
  const [frames, setFrames] = useState<Frame[]>([
    { id: 1, height: 12, depth: 12, distanceToNext: 4 },
    { id: 2, height: 12, depth: 12, distanceToNext: 4 },
  ]);
  const [selectedMaterialId, setSelectedMaterialId] =
    useState<string>("quarter-minus");

  const selectedMaterial =
    MATERIALS.find((m) => m.id === selectedMaterialId) || MATERIALS[0];

  const addFrame = () => {
    const newId = Math.max(...frames.map((f) => f.id)) + 1;
    setFrames([
      ...frames,
      { id: newId, height: 12, depth: 12, distanceToNext: 4 },
    ]);
  };

  const removeFrame = (id: number) => {
    if (frames.length > 1) {
      setFrames(frames.filter((f) => f.id !== id));
    }
  };

  const updateFrame = (id: number, field: keyof Frame, value: number) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const { totalVolume, segmentVolumes } = useMemo(() => {
    if (frames.length < 2) {
      return { totalVolume: 0, segmentVolumes: [] };
    }

    const segments: { from: number; to: number; volume: number }[] = [];
    let total = 0;

    for (let i = 0; i < frames.length - 1; i++) {
      const volume = calculateSegmentVolume(
        frames[i],
        frames[i + 1],
        frames[i].distanceToNext
      );
      segments.push({
        from: frames[i].id,
        to: frames[i + 1].id,
        volume,
      });
      total += volume;
    }

    return { totalVolume: total, segmentVolumes: segments };
  }, [frames]);

  const formattedTotal = formatVolume(totalVolume);
  const totalWeight =
    formattedTotal.cubicFeet * selectedMaterial.lbsPerCubicFoot;
  const formattedWeight = formatWeight(totalWeight);

  const inputClasses =
    "w-full px-3 py-2 border border-gray-300 dark:border-[var(--dark-midground)] rounded-md bg-white dark:bg-[var(--purple)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--green)]";

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h2 className="purple-light-text text-xl">Construction Tools</h2>
          <h1 className="text-4xl font-bold mt-8">
            Volume Calculator by Frames
          </h1>

          <p className="mt-4 mb-8 text-lg">
            Calculate the volume along a linear run. Each frame represents a
            rectangular cross-section slice. The volume between frames is
            calculated using trapezoidal approximation.
          </p>

          {/* Material Selection */}
          <div className="mb-6">
            <label
              htmlFor="material-select"
              className="block text-lg font-medium mb-2"
            >
              Select Material
            </label>
            <select
              id="material-select"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 dark:border-[var(--dark-midground)] rounded-md bg-white dark:bg-[var(--purple)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--green)] text-lg"
            >
              {MATERIALS.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <p className="text-sm opacity-70 mt-1">
              {selectedMaterial.description} —{" "}
              {selectedMaterial.lbsPerCubicFoot} lbs/ft³
            </p>
          </div>

          {/* Total Volume & Weight Display */}
          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-2xl font-bold green-text mb-2">
                  Total Volume
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-3xl font-bold">
                      {formattedTotal.cubicFeetStr}
                    </span>
                    <span className="text-lg ml-2">ft³</span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold">
                      {formattedTotal.cubicYardsStr}
                    </span>
                    <span className="text-lg ml-2">yd³</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold green-text mb-2">
                  Total Weight
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-3xl font-bold">
                      {formattedWeight.pounds}
                    </span>
                    <span className="text-lg ml-2">lbs</span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold">
                      {formattedWeight.tons}
                    </span>
                    <span className="text-lg ml-2">tons</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Frames List */}
          <div className="relative mb-6 pl-8">
            {/* Vertical line — from center of first dot to center of last dot */}
            {frames.length > 1 && (
              <div
                className="absolute bg-gray-300 dark:bg-[var(--dark-midground)]"
                style={{
                  width: "4px",
                  left: "18px",
                  top: "23px",
                  bottom: "23px",
                  borderRadius: "2px",
                }}
              />
            )}

            {frames.flatMap((frame, index) => {
              const elements = [];

              {
                /* Frame Node — big dot + card */
              }
              elements.push(
                <div
                  key={`frame-${frame.id}`}
                  className="relative flex items-start gap-6"
                >
                  {/* Big dot on the line */}
                  <div
                    className="absolute flex-shrink-0 z-10"
                    style={{
                      left: "-31px",
                      top: "4px",
                    }}
                  >
                    <div
                      className="rounded-full bg-[var(--green)] dark:bg-[var(--green)] shadow-lg border-4 border-white dark:border-[var(--purple)] flex items-center justify-center text-sm font-bold text-white"
                      style={{
                        width: "38px",
                        height: "38px",
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Frame content card */}
                  <div className="flex-1 ml-4 pb-2 pt-0.5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xl font-semibold">
                        Frame {index + 1}
                      </h4>
                      {frames.length > 1 && (
                        <button
                          onClick={() => removeFrame(frame.id)}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                          aria-label={`Remove frame ${index + 1}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`height-${frame.id}`}
                          className="block text-sm font-medium mb-1"
                        >
                          Height (inches)
                        </label>
                        <input
                          id={`height-${frame.id}`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={frame.height}
                          onChange={(e) =>
                            updateFrame(
                              frame.id,
                              "height",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`depth-${frame.id}`}
                          className="block text-sm font-medium mb-1"
                        >
                          Depth (inches)
                        </label>
                        <input
                          id={`depth-${frame.id}`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={frame.depth}
                          onChange={(e) =>
                            updateFrame(
                              frame.id,
                              "depth",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-sm opacity-70">
                      Cross-section: {(frame.height * frame.depth).toFixed(1)}{" "}
                      in² ({((frame.height * frame.depth) / 144).toFixed(2)}{" "}
                      ft²)
                    </div>
                  </div>
                </div>
              );

              {
                /* Distance Connector — between frames */
              }
              if (index < frames.length - 1) {
                elements.push(
                  <div
                    key={`dist-${frame.id}`}
                    className="relative flex items-start"
                  >
                    {/* Distance + segment volume content */}
                    <div className="flex-1 py-6 pl-4 my-2">
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-48">
                          <label
                            htmlFor={`distance-${frame.id}`}
                            className="block text-sm font-medium mb-1 opacity-80"
                          >
                            Distance to Frame {index + 2} (feet)
                          </label>
                          <input
                            id={`distance-${frame.id}`}
                            type="number"
                            min="0"
                            step="0.5"
                            value={frame.distanceToNext}
                            onChange={(e) =>
                              updateFrame(
                                frame.id,
                                "distanceToNext",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className={inputClasses}
                          />
                        </div>
                        {segmentVolumes[index] && (
                          <div className="text-sm purple-light-text pb-2">
                            Segment volume:{" "}
                            <span className="font-semibold">
                              {
                                formatVolume(segmentVolumes[index].volume)
                                  .cubicFeetStr
                              }{" "}
                              ft³
                            </span>{" "}
                            (
                            {
                              formatVolume(segmentVolumes[index].volume)
                                .cubicYardsStr
                            }{" "}
                            yd³)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return elements;
            })}

            {/* Insert Frame Button */}
            <div className="relative mt-8">
              {/* Big dot on the line */}
              <div
                className="absolute flex-shrink-0 z-10"
                style={{
                  left: "-31px",
                  top: "-1px",
                }}
              >
                <div
                  className="rounded-full bg-[var(--green)] dark:bg-[var(--green)] shadow-lg border-4 border-white dark:border-[var(--purple)] flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    width: "38px",
                    height: "38px",
                  }}
                >
                  +
                </div>
              </div>
              <button
                onClick={addFrame}
                className="btn btn-primary w-full sm:w-auto px-4 py-1 text-lg ml-0.5"
              >
                Add Frame
              </button>
            </div>
          </div>

          {/* Visual Representation */}
          {frames.length >= 2 && (
            <div className="mt-8 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Visual Preview</h3>
              <div className="flex items-end gap-2 overflow-x-auto pb-4">
                {frames.map((frame, index) => {
                  const maxHeight = Math.max(...frames.map((f) => f.height));
                  const scaledHeight =
                    maxHeight > 0 ? (frame.height / maxHeight) * 100 : 30;
                  const maxDepth = Math.max(...frames.map((f) => f.depth));
                  const scaledWidth =
                    maxDepth > 0
                      ? Math.max(20, (frame.depth / maxDepth) * 60)
                      : 30;

                  return (
                    <div key={frame.id} className="flex items-end">
                      {/* Frame rectangle */}
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
                      {/* Distance connector */}
                      {index < frames.length - 1 && (
                        <div className="flex flex-col items-center mx-1">
                          <div
                            className="bg-purple-300 dark:bg-purple-700 opacity-50"
                            style={{
                              height: "4px",
                              width: `${Math.max(
                                30,
                                frame.distanceToNext * 10
                              )}px`,
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
                Frame heights and widths are scaled proportionally. Numbers
                indicate frame index.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
