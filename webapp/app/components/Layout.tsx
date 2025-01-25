import { Link, NavLink } from "@remix-run/react";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import sun from "../images/sun.svg";
import moon from "../images/moon.svg";
import {
  ReactNode,
  useRef,
  useState,
  useCallback,
  SyntheticEvent,
} from "react";
import { useSchemePref } from "../hooks/useSchemePref";
import { useClickOutside } from "../hooks/useClickOutside";

export function Layout({ children }: { children?: ReactNode }) {
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
            <NavLink to="/seeds" className="p-2">
              Seeds
            </NavLink>
            <NavLink to="/uncooked" className="p-2">
              Uncooked
            </NavLink>
            <NavLink to="/path" className="p-2">
              Path
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
