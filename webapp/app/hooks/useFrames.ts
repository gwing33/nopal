import { useState, useMemo } from "react";

export interface Frame {
  id: number;
  height: number; // in inches
  depth: number; // in inches
  distanceToNext: number; // in feet
}

export interface SegmentVolume {
  from: number;
  to: number;
  volume: number;
}

export interface FormattedVolume {
  cubicFeet: number;
  cubicYards: number;
  cubicFeetStr: string;
  cubicYardsStr: string;
}

export interface FormattedWeight {
  pounds: string;
  tons: string;
}

export function formatVolume(cubicInches: number): FormattedVolume {
  const cubicFeet = cubicInches / 1728; // 12^3
  const cubicYards = cubicFeet / 27; // 3^3
  return {
    cubicFeet,
    cubicYards,
    cubicFeetStr: cubicFeet.toFixed(2),
    cubicYardsStr: cubicYards.toFixed(2),
  };
}

export function formatWeight(pounds: number): FormattedWeight {
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

const DEFAULT_FRAMES: Frame[] = [
  { id: 1, height: 12, depth: 12, distanceToNext: 4 },
  { id: 2, height: 12, depth: 12, distanceToNext: 4 },
];

export function useFrames(initialFrames: Frame[] = DEFAULT_FRAMES) {
  const [frames, setFrames] = useState<Frame[]>(initialFrames);

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
    setFrames(
      frames.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const { totalVolume, segmentVolumes } = useMemo(() => {
    if (frames.length < 2) {
      return { totalVolume: 0, segmentVolumes: [] as SegmentVolume[] };
    }

    const segments: SegmentVolume[] = [];
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

  return {
    frames,
    addFrame,
    removeFrame,
    updateFrame,
    totalVolume,
    segmentVolumes,
  };
}
