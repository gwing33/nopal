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

export function RandomFiveFactors() {
  return (
    <div className="five-factors">
      {factors.map(({ title, color }, index) => (
        <RandomFactor key={index} title={title} color={color} />
      ))}
    </div>
  );
}

function RandomFactor({ title, color }: { title: string; color: string }) {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    setPercent(Math.random() * 100);
    const interval = setInterval(() => setPercent(Math.random() * 100), 10000);
    return () => clearInterval(interval);
  }, []);

  return <Factor title={title} color={color} percent={percent} />;
}

export function HealthFactor({ score }: { score: number }) {
  return <FactorDetails {...factors[0]} score={score} />;
}

export function EfficiencyFactor({ score }: { score: number }) {
  return <FactorDetails {...factors[1]} score={score} />;
}

export function LongevityFactor({ score }: { score: number }) {
  return <FactorDetails {...factors[2]} score={score} />;
}

export function SocialEquityFactor({ score }: { score: number }) {
  return <FactorDetails {...factors[3]} score={score} />;
}

export function CarbonFactor({ score }: { score: number }) {
  return <FactorDetails {...factors[4]} score={score} />;
}

function Factor({
  title,
  color,
  percent,
}: {
  title: string;
  color: string;
  percent: number;
}) {
  return (
    <div className="factor">
      <h6>{title}</h6>
      <GoodProgress color={color} percent={percent} />
    </div>
  );
}

function FactorDetails({
  title,
  color,
  score,
}: {
  title: string;
  color: string;
  score: number;
}) {
  return (
    <div className="factor">
      <div className="flex gap-4 mb-1 flex justify-between items-center">
        <h6 className="font-bold text-xl">{title}</h6>
        <div className="italic">{score} / 10</div>
      </div>
      <GoodProgress color={color} percent={score * 10} />
    </div>
  );
}
