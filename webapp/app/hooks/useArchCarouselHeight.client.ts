import React, { useState, useEffect } from "react";

function getArchCarouselHeight() {
  const width = window.innerWidth > 740 ? 740 : window.innerWidth;
  const imgH = 400;
  const imgW = 740;
  const imgRatio = imgW / imgH;
  const height = width / imgRatio;
  return height + 24; // Add padding for carousel
}

export function useArchCarouselHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    setHeight(getArchCarouselHeight());
    const fn = () => setHeight(getArchCarouselHeight());
    window.addEventListener("resize", fn);
    window.addEventListener("orientationchange", fn);
    return () => {
      window.removeEventListener("resize", fn);
      window.removeEventListener("orientationchange", fn);
    };
  }, []);
  return height;
}
