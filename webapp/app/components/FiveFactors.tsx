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
  // This is dumb, but it simply forces a re-render every 10 seconds
  const [_update, setUpdate] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setUpdate(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="five-factors">
      {factors.map(({ title, color }, index) => (
        <div key={index} className="factor">
          <h6>{title}</h6>
          <GoodProgress color={color} percent={Math.random() * 100} />
        </div>
      ))}
    </div>
  );
}
