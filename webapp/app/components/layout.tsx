import { Link, useRouteLoaderData } from "@remix-run/react";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import sun from "../images/sun.svg";
import moon from "../images/moon.svg";
import { ReactNode } from "react";
import { type RootLoaderData } from "../root";

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<RootLoaderData>("root");
  const clientHints = data?.requestInfo?.clientHints;
  const colorSchemaPref =
    clientHints?.colorSchemePref || clientHints?.sysColorSchemePref;
  const isDark = colorSchemaPref === "dark";
  return (
    <>
      <div className="container mx-auto">
        <div className="py-4 flex justify-between items-center">
          <h1 className="text-6xl text-center">
            <Link to="/">
              <img src={isDark ? nopalDarkLogo : nopalLogo} alt="nopal" />
            </Link>
          </h1>
          <nav>
            <a className="p-2 hover:text-emerald-600">Explore</a>
            <a className="p-2 hover:text-emerald-600">Articles</a>
            <a className="p-2 hover:text-emerald-600">About</a>
          </nav>
          {isDark ? <img src={moon} alt="moon" /> : <img src={sun} alt="sun" />}
        </div>
      </div>
      {children}
    </>
  );
}
