import { Link, useLocation } from "@remix-run/react";
import nopalLogo from "../images/nopal-v1.svg";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="container mx-auto">
      <div className="py-4 flex justify-between items-center">
        <h1 className="text-6xl text-center">
          <Link to="/">
            <img src={nopalLogo} alt="nopal" />
          </Link>
        </h1>
        <nav>
          {!location.pathname.includes("login") ? (
            <Link className="p-1 hover:text-emerald-600" to="login">
              Login
            </Link>
          ) : null}
        </nav>
      </div>
      {children}
    </div>
  );
}
