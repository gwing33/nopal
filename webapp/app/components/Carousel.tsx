import { useState, useCallback, useRef } from "react";

export const Carousel = ({
  slides,
  height = "400px",
}: {
  slides: (setCurrent: Function) => React.ReactNode[];
  height?: string;
}) => {
  const [current, _setCurrent] = useState(0);
  const slideCountRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const [dragOffset, setDragOffset] = useState(0);

  const setCurrent = useCallback(
    (index: number) => {
      if (current == index) {
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

  const goNext = useCallback(() => {
    _setCurrent((prev) => (prev + 1 >= slideCountRef.current ? 0 : prev + 1));
  }, []);

  const goPrev = useCallback(() => {
    _setCurrent((prev) =>
      prev - 1 < 0 ? slideCountRef.current - 1 : prev - 1
    );
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine if horizontal swipe (only on first significant movement)
    if (!isSwiping.current && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isSwiping.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (isSwiping.current) {
      touchDeltaX.current = deltaX;
      setDragOffset(deltaX);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const SWIPE_THRESHOLD = 50;

    if (isSwiping.current) {
      if (touchDeltaX.current < -SWIPE_THRESHOLD) {
        goNext();
      } else if (touchDeltaX.current > SWIPE_THRESHOLD) {
        goPrev();
      }
    }

    isSwiping.current = false;
    touchDeltaX.current = 0;
    setDragOffset(0);
  }, [goNext, goPrev]);

  const _slides = slides(setCurrent);
  slideCountRef.current = _slides.length;

  const length = slideCountRef.current;
  const style: React.CSSProperties = {
    width: `${100 * length}%`,
    left: `-${current * 100}%`,
    // While dragging, apply the offset and disable the CSS transition for
    // real-time feedback. Once the finger lifts the offset resets to 0 and
    // the transition kicks back in to animate to the final slide.
    ...(dragOffset !== 0
      ? {
          transform: `translateX(${dragOffset}px)`,
          transition: "none",
        }
      : {}),
  };

  return (
    length > 0 && (
      <div className="carousel flex flex-col justify-end" style={{ height }}>
        <div
          ref={containerRef}
          className="carousel-content"
          style={style}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
