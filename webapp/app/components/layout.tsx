import { Link, useRouteLoaderData } from "@remix-run/react";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import sun from "../images/sun.svg";
import moon from "../images/moon.svg";
import pad from "../images/pad.svg";
import { ReactNode, useEffect, useState } from "react";
import { type RootLoaderData } from "../root";
import { useSchemePref } from "../hooks/useSchemePref";

export function Layout({ children }: { children: ReactNode }) {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  return (
    <>
      <div className="header container mx-auto pl-4 pr-4">
        <div className="py-4 flex justify-between items-center">
          <h1 className="text-6xl text-center">
            <Link to="/">
              <img src={isDark ? nopalDarkLogo : nopalLogo} alt="nopal" />
            </Link>
          </h1>
          <nav className="mr-4 ml-4">
            <Link to="/explore" className="p-2 hover:text-emerald-600">
              Explore
            </Link>
            <Link to="/health" className="p-2 hover:text-emerald-600">
              Health
            </Link>
            <Link to="/specs" className="p-2 hover:text-emerald-600">
              Specs
            </Link>
          </nav>
          {isDark ? (
            <img className="moon" src={moon} alt="moon" />
          ) : (
            <img className="sun" src={sun} alt="sun" />
          )}
        </div>
      </div>
      {children}
      <Footer />
    </>
  );
}

export function Footer() {
  return (
    <div className="footer flex gap-2 p-8 pt-4 pb-4">
      <img src={pad} alt="nopal" />
      <img src={pad} alt="nopal" />
      <img src={pad} alt="nopal" />
      <Link className="ml-4 underline" to="/about">
        About
      </Link>
    </div>
  );
}