import { ReactNode, useState } from "react";

export function Carousel({ items }: { items: ReactNode[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  return (
    <>
      <div className="mt-4 carousel">{items[selectedIdx]}</div>
      <nav className="text-xl carousel-nav">
        <a
          className={"prev " + (selectedIdx === 0 ? "disabled" : "")}
          onClick={(e) => {
            e.preventDefault();
            function getPrevIdx() {
              if (selectedIdx - 1 < 0) {
                return 0;
              }
              return selectedIdx - 1;
            }
            setSelectedIdx(getPrevIdx());
          }}
        >
          <span />
        </a>
        {items.map((i, idx) => {
          return (
            <a
              key={idx}
              className={selectedIdx === idx ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setSelectedIdx(idx);
              }}
            >
              <span />
            </a>
          );
        })}
        <a
          className={
            "next " + (selectedIdx === items.length - 1 ? "disabled" : "")
          }
          onClick={(e) => {
            e.preventDefault();
            function getNextIdx() {
              if (selectedIdx + 1 >= items.length) {
                return items.length - 1;
              }
              return selectedIdx + 1;
            }
            setSelectedIdx(getNextIdx());
          }}
        >
          <span />
        </a>
      </nav>
    </>
  );
}
