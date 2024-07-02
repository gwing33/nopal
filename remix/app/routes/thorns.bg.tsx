export default function ThornsBg() {
  return (
    <div className="container mx-auto">
      <p>
        The background color of Nopal slowly adjusts given the day and time.
        This means that every day and time is a unique color.
      </p>
      <BgColors />
    </div>
  );
}

function BgColors() {
  const now = new Date();
  return [...Array(12).keys()].map((m) => {
    const date = new Date(now.getFullYear(), m);

    return (
      <div className="my-10" key={m}>
        <div>{date.toLocaleString("default", { month: "long" })} 1st</div>
        <div className="flex">
          {[...Array(24).keys()].map((h) => {
            return (
              <ColorSwatch
                key={`light-${m}-${h}`}
                isLight={true}
                month={m}
                hour={h}
              />
            );
          })}
        </div>
        <div className="flex justify-stretch">
          {[...Array(24).keys()].map((h) => {
            return (
              <ColorSwatch
                key={`dark${m}-${h}`}
                isLight={false}
                month={m}
                hour={h}
              />
            );
          })}
        </div>
      </div>
    );
  });
}

type ColorSwatchProps = { isLight: boolean; month: number; hour: number };
function ColorSwatch({ isLight, month, hour }: ColorSwatchProps) {
  const className = isLight ? "naturalLightMode" : "naturalDarkMode";
  return (
    <div
      className={className + " inline-flex grow h-10 px-1 items-center"}
      style={getHSLByDate(new Date(2024, month, 1, hour))}
    >
      {hour}
    </div>
  );
}

function getHSLByDate(date: Date): React.CSSProperties {
  // For Hue
  const daysInYear = getDaysInYear(date.getFullYear());
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.valueOf() - start.valueOf();
  const days = diff / (1000 * 60 * 60 * 24);
  const hue = Math.floor(((daysInYear - days) / daysInYear) * 360) - 170;

  // For Saturation
  const time = date.getHours() + date.getMinutes() / 60;
  const hour = time > 12 ? 24 - time : time;
  const saturation = 20 + 5 * hour;

  return {
    "--hue": hue,
    "--saturation": saturation + "%",
  } as React.CSSProperties;
}

function getDaysInYear(year: number) {
  return (year % 4 === 0 && year % 100 > 0) || year % 400 == 0 ? 366 : 365;
}
