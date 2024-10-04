import { LinksFunction } from "@remix-run/node";
import { Layout, Footer } from "../components/layout";

import homeStyles from "../styles/home.css?url";
import exploreStyles from "../styles/explore.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: exploreStyles },
];

export default function About() {
  return (
    <Layout>
      <div className="mt-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl" style={{ color: "var(--purple-light)" }}>
            We build a future with nature.
          </h2>
          <p className="mt-4 text-lg">
            Smaller homes bring families together all
            <br />
            while nestling better into the landscape.
          </p>
        </div>
      </div>

      <div>
        <div className="max-w-7xl mx-auto">
          <span className="text-2xl" style={{ color: "var(--purple-light)" }}>
            Simple, eh?
          </span>
          <p className="mt-4 text-lg">
            A basic form factor allows us to build with better materials,
            <br />
            resulting in a surprisingly comfortable and healthy space.
          </p>
        </div>
      </div>

      <div>
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl" style={{ color: "var(--purple-light)" }}>
            Clean Air, Healthy Building.
          </h3>
          <p className="mt-4 text-lg">
            Air quality plays a big role in our lives. From wild fires to city
            smog, clean air can prevent you from getting or staying sick.
          </p>
        </div>
      </div>

      <div className="scene1">
        <div className="flex pt-28 max-w-7xl mx-auto relative">
          <div className="scene1-air-arrows" />
          <div className="w-1/3">
            <h4 className="text-2xl" style={{ color: "var(--green)" }}>
              Tight Building Envelope
            </h4>
            <ul className="list-disc list-inside">
              <li>Filter incoming air</li>
              <li>Reduces exterior noise</li>
              <li>Lower energy consumption</li>
            </ul>
          </div>
          <div className="w-1/3">
            <h4 className="text-2xl" style={{ color: "var(--green)" }}>
              Natural Materials
            </h4>
            <ul className="list-disc list-inside">
              <li>Lower environmental impact</li>
              <li>Less toxic (lower VOCs)</li>
              <li>More durable and easier to maintain</li>
            </ul>
          </div>
        </div>{" "}
      </div>

      <div className="scene0">
        <div className="scene0-bg" />
        <div className="scene0-shadow-bg" />
        <div className="scene0-pricklyPearFruit" />
        <div className="flex items-center justify-center h-full md:justify-end md:items-start">
          <div className="scene0-content flex items-end justify-center flex-col p-10 lg:p-20">
            <h2 className="text-2xl">Curious?</h2>
            <p className="text-base max-w-96 mt-4 mb-4 text-right">
              Let’s learn together.
              <br />
              We invite you to join the discussion below.
            </p>
            <div className="flex gap-4 items-center">
              <a
                href="https://discord.gg/6KypDmxE"
                target="_blank"
                className="btn-secondary"
              >
                Join our Discord
              </a>
              {/* <a href="#todo" className="p-4 pt-2 pb-2">
                Email us
              </a> */}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
