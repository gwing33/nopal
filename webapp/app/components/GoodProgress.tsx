export function GoodProgress({
  color,
  percent,
}: {
  color: string;
  percent: number;
}) {
  return (
    <div className="good-progress">
      <div
        className="good-bar"
        style={{ backgroundColor: color, width: `${percent}%` }}
      ></div>
      <div
        className="good-dot"
        style={{ backgroundColor: color, left: `calc(${percent}% - 4px)` }}
      ></div>
    </div>
  );
}
