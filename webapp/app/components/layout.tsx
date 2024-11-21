import { Link, NavLink } from "@remix-run/react";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import sun from "../images/sun.svg";
import moon from "../images/moon.svg";
import pad from "../images/pad.svg";
import { ReactNode } from "react";
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
          <nav className="main-nav mr-4 ml-4">
            <NavLink to="/explore" className="p-2">
              Explore
            </NavLink>
            <NavLink to="/uncooked" className="p-2">
              Uncooked
            </NavLink>
          </nav>
          {isDark ? (
            <img className="moon" src={moon} alt="moon" />
          ) : (
            <img className="sun" src={sun} alt="sun" />
          )}
        </div>
      </div>
      {children}
    </>
  );
}

export function ContactUsLinks() {
  return (
    <div className="flex gap-4 items-center">
      <a
        href="https://discord.gg/avFGzMNAXu"
        target="_blank"
        className="btn-secondary"
      >
        Join our Discord
      </a>
      {/* <a href="#todo" className="p-4 pt-2 pb-2">
        Email us
      </a> */}
    </div>
  );
}

export function Footer() {
  return (
    <div className="footer flex gap-2 p-8 pt-4 pb-4">
      <img src={pad} alt="nopal" />
      <img src={pad} alt="nopal" />
      <img src={pad} alt="nopal" />
    </div>
  );
}
