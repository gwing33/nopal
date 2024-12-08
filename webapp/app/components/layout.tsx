import { Link, NavLink } from "@remix-run/react";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import sun from "../images/sun.svg";
import moon from "../images/moon.svg";
import pad from "../images/pad.svg";
import {
  ReactNode,
  useRef,
  useState,
  useCallback,
  SyntheticEvent,
} from "react";
import { useSchemePref } from "../hooks/useSchemePref";
import { useClickOutside } from "../hooks/useClickOutside";

export function Layout({ children }: { children: ReactNode }) {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  const [expanded, setExpanded] = useState(false);
  const onMenuClick = useCallback(
    (e: SyntheticEvent) => {
      e?.preventDefault();
      setExpanded(!expanded);
    },
    [expanded]
  );
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setExpanded(false));
  return (
    <>
      <div className="header container mx-auto pl-4 pr-4">
        <div className="py-4 flex justify-between items-center">
          <h1 className="text-6xl text-center">
            <Link to="/">
              <img src={isDark ? nopalDarkLogo : nopalLogo} alt="nopal" />
            </Link>
          </h1>
          <a href="#" onClick={onMenuClick} className="hamburger-menu">
            Menu
            <div className="menu-bars">
              <div />
              <div />
              <div />
            </div>
          </a>
          <nav
            ref={ref}
            className="main-nav mr-4 ml-4"
            style={expanded ? { display: "block" } : {}}
          >
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
      <a href="mailto:human@nopal.build" className="p-4 pt-2 pb-2">
        Email us
      </a>
    </div>
  );
}

export function Footer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="scene0">
      <div className="scene0-bg" />
      <div className="scene0-shadow-bg" />
      <div className="scene0-pricklyPearFruit" />
      <div className="flex items-center justify-center h-full md:justify-end md:items-start">
        <div className="scene0-content flex items-end justify-center flex-col p-10 lg:p-20">
          <h2 className="text-2xl">{title}</h2>
          <p className="text-base max-w-96 mt-4 mb-4 text-right">{children}</p>
          <ContactUsLinks />
        </div>
      </div>
      <div className="footer flex gap-2 p-8 pt-4 pb-4">
        <img src={pad} alt="nopal" />
        <img src={pad} alt="nopal" />
        <img src={pad} alt="nopal" />
      </div>
    </div>
  );
}
