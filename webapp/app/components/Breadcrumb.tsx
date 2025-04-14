import { GoodArrow } from "./GoodAssets";

export function Breadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <div className="breadcrumbs">
      <GoodArrow />
      {children}
    </div>
  );
}
