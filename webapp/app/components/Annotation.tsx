import { DownLeftArrow } from "../svg/arrows/DownLeftArrow";

export function Annotation({ children }: { children: React.ReactNode }) {
  return (
    <div className="annotation">
      <div className="annot-container">
        <DownLeftArrow /> {children}
      </div>
    </div>
  );
}
