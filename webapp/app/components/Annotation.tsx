import { DownLeftArrow } from "../svg/arrows/DownLeftArrow";

export function Annotation({
  children,
  left,
}: {
  children: React.ReactNode;
  left?: boolean;
}) {
  return (
    <div className={left ? "annotation-left" : "annotation"}>
      <div className="annot-container">
        <DownLeftArrow /> {children}
      </div>
    </div>
  );
}
