type Props = { score: number };
export function GbScore({ score }: Props) {
  return (
    <div
      className="gb-score shrink-0 relative inline-flex items-center justify-center"
      style={{ width: "60px", height: "32px" }}
    >
      <DisplayScore score={score} />
      <svg
        className="absolute"
        width="60"
        height="32"
        viewBox="0 0 60 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M28.599 31.0329C8.63073 28.5957 -3.06643e-06 21.6442 -2.87312e-06 17.2217C-2.6628e-06 12.4101 11.9424 4.18852 29.2275 1.07621C44.3936 -1.65456 56.8837 7.301 59.7121 18.7779C62.5406 30.2548 43.9642 32.9083 28.599 31.0329Z"
          className="midground-stroke"
          fill={getBgColor(score)}
        />
      </svg>
    </div>
  );
}

function DisplayScore({ score }: Props) {
  if (isDead(score)) {
    return (
      <svg
        className="z-10"
        width="14"
        height="19"
        viewBox="0 0 14 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.80461 12.9392C4.80461 12.9392 2.44256 12.5455 1.19912 12.0012C-0.0443124 11.457 -0.0847819 8.33125 0.0559199 7.36979C0.231797 6.16796 1.86103 -0.238866 6.78559 0.669833C11.7102 1.57853 12.2794 2.53316 13.0415 4.84888C13.7236 6.92132 14.0968 10.7408 13.0415 11.8547C12.5351 12.3892 10.9871 12.7858 10.3618 12.6881C10.3618 12.6881 11.9569 17.7465 11.7981 18.111C11.6392 18.4754 8.79116 18.8311 8.3978 18.3455C8.00444 17.8599 8.3978 12.9392 8.3978 12.9392H6.78559C6.78559 12.9392 7.82383 17.8931 7.60635 18.1403C7.38887 18.3875 4.80461 18.5729 4.39423 18.3455C3.6614 17.9393 4.80461 12.9392 4.80461 12.9392ZM5.68397 8.27835C5.47878 8.65942 3.66138 9.1636 3.19238 8.95255C2.60612 8.68873 1.78536 5.81607 2.54749 5.2005C3.30963 4.58493 4.65802 4.26249 5.0684 4.84875C5.3967 5.31775 5.88916 7.89728 5.68397 8.27835ZM7.29617 8.27833C7.09098 7.92657 7.84726 4.98942 8.64457 4.84872C9.6412 4.67284 10.9017 5.08322 11.1655 5.81604C11.4293 6.54887 11.2997 9.09909 10.1102 9.1284C9.15858 9.15185 7.50136 8.63008 7.29617 8.27833Z"
          fill="var(--yellow-light)"
        />
      </svg>
    );
  }
  return (
    <span
      className="z-10 pl-2 font-bold font-mono text-xl"
      style={{ color: getTextColor(score) }}
    >
      {score}
    </span>
  );
}

function getBgColor(score: number) {
  if (isGood(score)) {
    return "var(--green)";
  } else if (isPrettyGood(score)) {
    return "var(--green-light)";
  } else if (isOk(score)) {
    return "var(--yellow)";
  } else if (isMeh(score)) {
    return "var(--yellow-light)";
  } else if (isPrettyBad(score)) {
    return "var(--red-light)";
  } else if (isBad(score)) {
    return "var(--red)";
  }
  return "var(--purple)";
}

function getTextColor(score: number) {
  if (isGood(score)) {
    return "var(--yellow-light)";
  } else if (isPrettyGood(score)) {
    return "white";
  } else if (isMeh(score)) {
    return "var(--purple-light)";
  } else if (isPrettyBad(score)) {
    return "var(--red)";
  } else if (isBad(score)) {
    return "var(--red-light)";
  }
  return "var(--yellow-light)";
}

const isGood = (score: number) => score > 45;
const isPrettyGood = (score: number) => score > 36;
const isOk = (score: number) => score > 27;
const isMeh = (score: number) => score > 19;
const isPrettyBad = (score: number) => score > 11;
const isBad = (score: number) => score >= 5;
const isDead = (score: number) => score < 5;
