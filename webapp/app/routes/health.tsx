import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";
import { Outlet, NavLink, useLocation, useNavigate } from "@remix-run/react";
import { GbScore } from "../components/GbScore";
import { LinksFunction } from "@remix-run/node";
import healthStyles from "../styles/health.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: healthStyles },
];

export function shouldRevalidate() {
  return false;
}

export default function Health() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = location?.search || "";
  const isTutorial = search.includes("tutorial=true");

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container">
          <h1 className="purple-light-text text-4xl mt-12">
            The Good Building Score
          </h1>
          <div className="flex gap-2 mt-8">
            <GbScore score={0} />
            <GbScore score={5} />
            <GbScore score={15} />
            <GbScore score={25} />
            <GbScore score={35} />
            <GbScore score={45} />
            <GbScore score={50} favorite={true} />
          </div>
          <div className="mt-2">
            <a
              className="link font-mono text-lg"
              onClick={(e) => {
                e.preventDefault();
                navigate(isTutorial ? "" : "?tutorial=true", { replace: true });
              }}
              href={isTutorial ? "" : "?tutorial=true"}
            >
              {isTutorial ? "Hide" : "Enable"} Tutorial
            </a>
          </div>

          {isTutorial && (
            <div className="mt-8">
              <p className="text-xl">
                We review <b>ingredients & recipes</b> by looking at 5 Factors:
              </p>
              <p className="text-xl mt-8">
                Before you get to that information, you’ll be presented with a
                collective score. This is the <b>Good Building Score</b>.
              </p>
            </div>
          )}

          <div className="folder-tabs mt-12">
            <NavLink
              to={"/health/ingredients" + search}
              className={() => {
                if (/^\/health(\/ingredients)??\/?$/.test(location.pathname)) {
                  return "active";
                }
                return "";
              }}
            >
              Ingredients
            </NavLink>
            <NavLink to={"/health/recipes" + search}>Recipes</NavLink>
            <NavLink to={"/health/collections" + search}>Collections</NavLink>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Outlet />
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
