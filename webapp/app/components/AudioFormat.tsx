import { RightArrow } from "../svg/arrows/RightArrow";

export function AudioFormat({ href }: { href?: string }) {
  if (!href) {
    return null;
  }
  return (
    <a
      href={href}
      target="_blank"
      className="font-hand text-xl inline-flex items-center gap-2"
    >
      <RightArrow />
      Now available in audio format
    </a>
  );
}
