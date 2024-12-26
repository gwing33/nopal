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
                <Link className="link" to="/mrgnt/uncooked">
                  +Presentation
                </Link>
              </li>
              <li>
                <a className="link text-nowrap">+Newpaper Clippings</a>
              </li>
              <li>
                <a className="link">+Print</a>
              </li>
              <li>
                <a className="link">+View-Master Reel</a>
              </li>
              <li>
                <a className="link">+Betamax</a>
              </li>
            </ul>
          </div>
        </div>
        <Outlet />
      </div>
    </>
  );
}
