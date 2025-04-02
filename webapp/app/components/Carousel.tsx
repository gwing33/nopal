import { useState, useReducer, useEffect } from "react";
// import { useSwipeable, SwipeableHandlers, EventData } from 'react-swipeable';

export const Carousel = ({
  slides,
  height = 400,
}: {
  slides: React.ReactNode[];
  height?: number;
}) => {
  const [current, setCurrent] = useState(0);

  const length = slides.length;
  const style: React.CSSProperties = {
    width: `${100 * length}%`,
    left: `-${current * 100}%`,
  };

  return (
    length > 0 && (
      <div
        className="carousel flex flex-col justify-end"
        style={{ height: height + 24 + "px" }}
      >
        <div className="carousel-content" /*{...handlers} */ style={style}>
          {slides.map((slide, index) => (
            <div className="carousel-item" key={index}>
              {slide}
            </div>
          ))}
        </div>
        <ol className="carousel-indicators">
          {slides.map((_, index) => (
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
