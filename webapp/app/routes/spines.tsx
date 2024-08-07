import { Link, Outlet } from "@remix-run/react";

export default function SpinesLayout() {
  return (
    <div className="flex flex-col h-screen">
      <nav className="border-b-2">
        <div className="container mx-auto flex items-center py-4 justify-between">
          <h1 className="text-lg">
            Nopal Spines <span className="text-sm">[Design System]</span>
          </h1>
          <div className="flex gap-8">
            <Link to="/spines">Overview</Link>
            <Link to="/spines/bg">BG</Link>
          </div>
        </div>
      </nav>
      <main className="overflow-y-auto my-10">
        <Outlet />
      </main>
    </div>
  );
}
