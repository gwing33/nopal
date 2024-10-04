import { LinksFunction } from "@remix-run/node";
import { Layout, ContactUsLinks, Footer } from "../components/layout";

import homeStyles from "../styles/home.css?url";
import exploreStyles from "../styles/explore.css?url";
import exampleHome from "../images/explore/example-home.svg";
import airArrows from "../images/explore/air-arrows.svg";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: exploreStyles },
];

export default function Explore() {
  return (
    <Layout>
      <div className="explore-bg">
        <div className="mt-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl" style={{ color: "var(--purple-light)" }}>
              We build a future with nature.
            </h2>
            <p className="mt-4 mb-4 text-lg max-w-lg">
              Smaller homes bring families together all while nestling better
              into the landscape.
            </p>
            <div className="example-home">
              <div className="example-home-arrow text-md">Example home</div>
              <img src={exampleHome} alt="Example Home" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 flex justify-end">
          <div className="w-1/2">
            <div>
              <span
                className="text-2xl"
                style={{ color: "var(--purple-light)" }}
              >
                Simple, eh?
              </span>
              <p className="mt-4 text-lg max-w-lg">
                A basic form factor allows us to build with better materials,
                resulting in a surprisingly comfortable and healthy space.
              </p>
            </div>
            <div className="home-size-ranges">
              <div className="sq-ft-range">1,536 - 2,400 sq/ft</div>
              <div className="width">
                32 - 40’
                <div />
              </div>
              <div className="depth">
                <div />
                48 - 60’
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="container mx-auto px-4">
            <h3 className="text-4xl" style={{ color: "var(--purple-light)" }}>
              Clean Air, Healthy Building.
            </h3>
            <p className="mt-4 text-lg">
              Air quality plays a big role in our lives. From wild fires to city
              smog, clean air can prevent you from getting or staying sick.
            </p>
          </div>
        </div>
      </div>

      <div className="scene1">
        <div className="container mx-auto mt-2 px-4">
          <img src={airArrows} alt="Air arrows" style={{ width: "85%" }} />
        </div>
        <div className="flex -mt-6 container mx-auto px-4">
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
        </div>
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
            <ContactUsLinks />
          </div>
        </div>
        <Footer />
      </div>
    </Layout>
  );
}
