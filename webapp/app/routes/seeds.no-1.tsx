import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { useSchemePref } from "../hooks/useSchemePref";
import { Print } from "../components/Print";

import seedNo1LightImg from "../images/seeds/seed-no-1-light.svg";
import seedNo1DarkImg from "../images/seeds/seed-no-1-dark.svg";

import homeStyles from "../styles/home.css?url";
import seedsStyles from "../styles/seeds.css?url";
import projectStyles from "../styles/project.css?url";
import { useState } from "react";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
  { rel: "stylesheet", href: seedsStyles },
];

export default function SeedNo1() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container">
          <img
            src={isDark ? seedNo1DarkImg : seedNo1LightImg}
            alt="Seed No.1"
            className="mt-8 md:-ml-4 pb-16"
          />
          <div className="flex flex-col gap-4">
            <p>
              Welcome <b>Home</b>,
            </p>
            <p>
              What do you want out of a home? Take a moment and think about
              it....
            </p>
            <p>
              The building you grew up in helped shape who you are today. This
              is why we try and understand how the built environment can help
              foster these precious experiences.
            </p>
            <p>
              We welcome you to join us on a journey of learning as we seek to
              build this home.
            </p>
            <p>Cheers,</p>
            <p>-Gerald, Austin, James</p>
          </div>
          <div className="mt-16">
            <Print
              print={{
                id: "presentation-no-1",
                type: "presentation",
                title: "Understanding",
                author: "Austin Trautman",
                body: "We are all about understanding the built environment and how it can foster experiences.",
                date: "2024-12-06T12:00:00-07:00",
                customImage: "/seeds/presentation-no.1.png",
                externalHref: "https://www.google.com",
              }}
            />
          </div>
          <BaseFloorPlan />
          <SitePlanNo1 />
        </div>
      </div>
      <Footer title="Suggestions?">
        We are always looking to add more to our collection.
      </Footer>
    </Layout>
  );
}

function BaseFloorPlan() {
  const [width, setWidth] = useState(36);
  const [height, setHeight] = useState(60);
  const fixedHeight = 356;
  const _width = (width / height) * fixedHeight;
  const sqft = width * height;
  const availableWidths = [32, 36, 40];
  const availableHeights = [48, 52, 56, 60, 64];

  return (
    <div className="flex flex-col sm:flex-row mt-12 pb-12">
      <div className="pt-4 sm:pt-0 sm:pl-4">
        <h3 className="font-bold">Floor Plan Base</h3>
        <p className="pb-4">
          Due to the lot size and constraints we developed this layout to focus
          on utilizing as much of the lot while preserving nature.
        </p>
        <p>
          The entrance is a core space in any home and it should be welcoming.
        </p>
      </div>
      <div
        className="base-floor-plan-graphic"
        style={{
          maxWidth: fixedHeight + "px",
          maxHeight: fixedHeight + "px",
        }}
      >
        <div>
          <div
            className="base-floor-plan-shell"
            style={{
              width: _width + "px",
              height: fixedHeight + "px",
            }}
          >
            <div className="base-floor-plan-mech">Mechanical</div>
            <span className="base-floor-plan-sqft">
              {sqft.toLocaleString()} sq/ft
            </span>
          </div>
          <div className="flex justify-center items-center base-width gap-2">
            <div className="line" />
            {availableWidths.map((w) => (
              <BaseSizeLink
                key={w}
                size={w}
                active={w == width}
                onClick={setWidth}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center base-height gap-4">
          <div className="line" />
          {availableHeights.map((h) => (
            <BaseSizeLink
              key={h}
              size={h}
              active={h == height}
              onClick={setHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BaseSizeLink({
  size,
  onClick,
  active,
}: {
  size: number;
  onClick: (size: number) => void;
  active: boolean;
}) {
  return (
    <a
      className={(active ? "active " : "") + "base-size-link link"}
      onClick={(e) => {
        e.preventDefault();
        onClick(size);
      }}
    >
      <span>{size}'</span>
      <div className="line" />
    </a>
  );
}

function SitePlanNo1() {
  return (
    <div className="flex flex-col sm:flex-row mt-12">
      <div
        className="flex-shrink-0"
        style={{
          maxWidth: "356px",
          maxHeight: "356px",
        }}
      >
        <img src={"/seeds/site-plan-no-1.png"} alt={"Site Plan No.1"} />
      </div>
      <div className="pt-4 sm:pt-0 sm:pl-4">
        <h3 className="font-bold">Site Plan No.1</h3>
        <p className="pb-4">
          We built simple rectangles on 4’ increments. We also define a central
          mechanical space, you could think of this as a heart. It pumps in
          fresh filtered air and maintains temperature.
        </p>
        <p>
          The remainder of the space is open to explore room sizes and locations
          and where you enter and exit.
        </p>
      </div>
    </div>
  );
}
