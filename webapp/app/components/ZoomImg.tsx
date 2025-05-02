import { useEffect, useState } from "react";

type ZoomImgProps = {
  fullSrc: string;
  src: string;
  alt: string;
  className?: string;
};

const preloadImg: Record<string, boolean> = {};

// A pretty dumb zoom approach, but it works.
export function ZoomImg({ fullSrc, ...rest }: ZoomImgProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (!preloadImg[fullSrc]) {
        const image = new Image();
        image.src = fullSrc;
        preloadImg[fullSrc] = true;
      }
    }, 100); // Small bump to let other things queue up.
    return () => clearTimeout(t);
  }, []);

  return (
    <a href={fullSrc} target="_blank" rel="noopener noreferrer">
      <img {...rest} />
    </a>
  );
}
