import { Link, Outlet } from "react-router";
import mrgntStyles from "../styles/mrgnt.css?url";
import { LinksFunction } from "react-router";

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
                <Link to="/mrgnt/humans" className="link">
                  +Humans
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
