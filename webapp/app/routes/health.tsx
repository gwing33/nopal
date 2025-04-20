import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";
import { Link, Outlet, NavLink, useLocation } from "@remix-run/react";
import { GbScore } from "../components/GbScore";
import { LinksFunction } from "@remix-run/node";
import healthStyles from "../styles/health.css?url";
import {
  HealthFactor,
  EfficiencyFactor,
  LongevityFactor,
  CarbonFactor,
  SocialEquityFactor,
} from "../components/FiveFactors";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: healthStyles },
];

export default function Health() {
  const location = useLocation();
  const search = location?.search || "";
  const isTutorial = search.includes("tutorial=true");

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h1 className="purple-light-text text-4xl mt-12">
            The Good Building Score
          </h1>
          <div className="flex flex-wrap">
            <div className="flex gap-2 mt-4 mr-2">
              <GbScore score={0} />
              <GbScore score={5} />
              <GbScore score={15} />
              <GbScore score={25} />
            </div>
            <div className="flex gap-2  mt-4">
              <GbScore score={35} />
              <GbScore score={45} />
              <GbScore score={50} favorite={true} />
            </div>
          </div>
          <div className="mt-2">
            <Link
              to={isTutorial ? "" : "?tutorial=true"}
              replace
              preventScrollReset
              prefetch="intent"
              style={{ height: "28px" }}
              className="inline-flex link font-mono text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
                <path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" />
                <path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
                <path d="M4.893 4.893a1 1 0 0 1 1.32 -.083l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 0 -1.414z" />
                <path d="M17.693 4.893a1 1 0 0 1 1.497 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7z" />
                <path d="M14 18a1 1 0 0 1 1 1a3 3 0 0 1 -6 0a1 1 0 0 1 .883 -.993l.117 -.007h4z" />
                <path d="M12 6a6 6 0 0 1 3.6 10.8a1 1 0 0 1 -.471 .192l-.129 .008h-6a1 1 0 0 1 -.6 -.2a6 6 0 0 1 3.6 -10.8z" />
              </svg>
              {isTutorial ? "End Tutorial" : "Start Tutorial"}
            </Link>
          </div>

          {isTutorial && (
            <div className="mt-8 relative">
              <div className="special-flower font-hand red-text text-2xl">
                Flowers are Special.
                <svg
                  width="76"
                  height="83"
                  viewBox="0 0 76 83"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M71.4846 81.962C71.4846 81.962 90.2278 51.9659 37.5359 24.6995C23.4292 17.3997 1.23367 6.35845 1.23367 6.35845M1.23367 6.35845L6.28456 20.4728C6.89327 22.1738 9.2667 22.2599 9.99695 20.6074L17.2397 4.21787C17.95 2.61062 16.3909 0.934355 14.7365 1.52641L1.23367 6.35845Z"
                    className="red-stroke"
                  />
                </svg>
              </div>
              <p className="text-xl">
                We review <b>ingredients & recipes</b> by looking at 5 Factors:
              </p>
              <div className="flex gap-8 items-center">
                <div className="flex flex-col gap-4 mt-4 w-2/3">
                  <div>
                    <HealthFactor verbose={true} score={7} />
                  </div>
                  <div>
                    <EfficiencyFactor score={4} />
                  </div>
                  <div>
                    <LongevityFactor score={8} />
                  </div>
                  <div>
                    <SocialEquityFactor score={5} />
                  </div>
                  <div>
                    <CarbonFactor score={3} />
                  </div>
                </div>
                <div className="relative font-hand text-2xl red-text w-1/3">
                  <svg
                    width="141"
                    height="50"
                    viewBox="0 0 141 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M139.735 49.6558C139.735 49.6558 96.1783 -7.46098 39.4723 1.77095C23.7951 4.32325 0.999983 14.9669 0.999983 14.9669M0.999983 14.9669L14.6331 21.2011C16.2761 21.9524 17.9943 20.3127 17.3206 18.6364L10.6387 2.01035C9.98339 0.379903 7.69482 0.326392 6.96406 1.92443L0.999983 14.9669Z"
                      stroke="#A63B31"
                    />
                  </svg>
                  We rate each factor out of 10.
                </div>
              </div>
              <p className="text-xl mt-8">
                Before we get to that info, you’ll be presented with a
                collective score. This is the <b>Good Building Score</b>.
              </p>
            </div>
          )}

          <div className="folder-tabs mt-12">
            <NavLink
              prefetch="render"
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
            {/* <NavLink to={"/health/recipes" + search}>Recipes</NavLink>
            <NavLink to={"/health/collections" + search}>Collections</NavLink> */}
          </div>
          {isTutorial && (
            <div className="font-hand red-text text-2xl mt-4">
              Psst...click the box
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Outlet />
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
