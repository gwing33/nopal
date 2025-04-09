import { useState, useCallback, useRef, useEffect } from "react";

export const Carousel = ({
  slides,
  height = "400px",
}: {
  slides: (setCurrent: Function) => React.ReactNode[];
  height?: string;
}) => {
  const [current, _setCurrent] = useState(0);
  const slideCountRef = useRef<number>(0);
  const setCurrent = useCallback(
    (index: number) => {
      if (current == index) {
        // Send it back through itself
        setCurrent(current - 1);
        return;
      }
      if (index == -1) {
        _setCurrent(slideCountRef.current - 1);
        return;
      }
      if (index >= slideCountRef.current) {
        _setCurrent(0);
        return;
      }
      _setCurrent(index);
    },
    [current]
  );
  const _slides = slides(setCurrent);
  slideCountRef.current = _slides.length;

  const length = slideCountRef.current;
  const style: React.CSSProperties = {
    width: `${100 * length}%`,
    left: `-${current * 100}%`,
  };

  return (
    length > 0 && (
      <div className="carousel flex flex-col justify-end" style={{ height }}>
        <div className="carousel-content" style={style}>
          {_slides.map((slide, index) => (
            <div className="carousel-item" key={index}>
              {slide}
            </div>
          ))}
        </div>
        <ol className="carousel-indicators">
          {_slides.map((_, index) => (
            <li
              onClick={() => setCurrent(index)}
              key={index}
              className={`${current === index ? "active" : ""}`}
            />
          ))}
        </ol>
      </div>
    )
  );
};
