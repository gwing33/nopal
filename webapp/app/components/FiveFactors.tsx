import { useEffect, useState } from "react";
import { GoodProgress } from "./GoodProgress";

export const factors = [
  {
    title: "Health",
    color: "var(--green)",
  },
  {
    title: "Efficiency",
    color: "var(--green-light)",
  },
  {
    title: "Longevity",
    color: "var(--pink)",
  },
  {
    title: "Social Equity",
    color: "var(--red-light)",
  },
  {
    title: "Carbon",
    color: "var(--red)",
  },
];

export function FiveFactors() {
  return (
    <div className="five-factors">
      {factors.map(({ title, color }, index) => (
        <Factor key={index} title={title} color={color} />
      ))}
    </div>
  );
}

function Factor({ title, color }: { title: string; color: string }) {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    setPercent(Math.random() * 100);
    const interval = setInterval(() => setPercent(Math.random() * 100), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="factor">
      <h6>{title}</h6>
      <GoodProgress color={color} percent={percent} />
    </div>
  );
}
