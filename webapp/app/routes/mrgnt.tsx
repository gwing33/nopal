import { Link, Outlet } from "@remix-run/react";
import mrgntStyles from "../styles/mrgnt.css?url";
import { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mrgntStyles },
];

export default function Mrgnt() {
  return (
    <>
      <div className="mdid">MRGNT No.0</div>
      <div className="notions">
        <div>
          <div className="notions-box">
            <ul>
              <li>
                <Link to="/mrgnt/gbs" className="link">
                  +Materials & Assemblies
                </Link>
              </li>
              <li>
                <Link to="/mrgnt/uncooked?type=presentation" className="link">
                  +Presentation
                </Link>
              </li>
              <li>
                <Link
                  to="/mrgnt/uncooked?type=newspaper-clipping"
                  className="link text-nowrap"
                >
                  +Newpaper Clippings
                </Link>
              </li>
              <li>
                <Link to="/mrgnt/uncooked?type=print" className="link">
                  +Print
                </Link>
              </li>
              <li>
                <Link
                  to="/mrgnt/uncooked?type=view-master-reel"
                  className="link"
                >
                  +View-Master Reel
                </Link>
              </li>
              <li>
                <Link to="/mrgnt/uncooked?type=betamax" className="link">
                  +Betamax
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Outlet />
      </div>
    </>
  );
}
