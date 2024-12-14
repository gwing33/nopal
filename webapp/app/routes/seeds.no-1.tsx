import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { useSchemePref } from "../hooks/useSchemePref";
import { useMarkdown } from "../hooks/useMarkdown";
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
                date: "2024-12-11T12:00:00-07:00",
                customImage: "/seeds/presentation-no.1.png",
                externalHref: "https://www.youtube.com/watch?v=WPiKfiCSGks",
              }}
            />
          </div>
          <BaseFloorPlan />
          <SitePlanNo1 />
          <Details />
        </div>
      </div>
      <Footer title="Seed curious?">
        Every seed is nurtured into something unique, reach out to learn what
        yours mine grow into.
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
      <div className="pb-8 sm:pl-4">
        <h3 className="font-bold">Floor Plan Base</h3>
        <p className="pb-4">
          We build simple rectangles on 4’ increments. We also define a central
          mechanical space, you could think of this as a heart. It pumps in
          fresh filtered air and maintains temperature.
        </p>
        <p>
          The remainder of the space is open to explore room sizes, locations
          and where you enter and exit.
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
    <div className="flex flex-col-reverse sm:flex-row mt-12">
      <div
        className="flex-shrink-0 pt-4 sm:pt-0"
        style={{
          maxWidth: "356px",
          maxHeight: "550px",
        }}
      >
        <img src={"/seeds/site-plan-no-1.png"} alt={"Site Plan No.1"} />
      </div>
      <div className="pb-4 sm:pl-4">
        <h3 className="font-bold">Site Plan No.1</h3>
        <p className="pb-4">
          Due to the lot size and constraints we developed this layout to focus
          on utilizing as much of the lot while preserving nature.
        </p>
        <p>
          The entrance is a core space in any home and it should be welcoming.
        </p>
      </div>
    </div>
  );
}

function Details() {
  const html = useMarkdown(`# Specifications

*All Nopal buildings use our Baselayer System. Details coming soon...*


##### Flooring Details
- Polished Concrete
- Radiant Cooled & Heated
- Vapor barrier
- Insulated Perimeter

##### Medium Timber Framing
- Lower Thermal Bridging
- Air tight envelope
- Vaulted ceilings
- 4' Exterior Overhangs

##### Wall Insulation
- 3" of wool (Havelock)
- 3" of wood fiber (TimberHP)
- R22

##### Ceiling Insulation
- 6" of wool (Havelock)
- 6" of wood fiber (TimerHP)
- R44

##### Interior Finishes
- Plywood Walls
- Felt Ceilings
- Nopal Doors

##### Exterior Finishes
- Hardwood walls
- Deck
- Standing seam metal roof

##### Mechanical
- Hot & cold water R32 exterior heat pump
- Radiant heating and cooling
- No forced air heating and cooling
- Hyrdronic-based dehumidification
- MERV 15 whole house filtration
- 24/7 balanced fresh air every room (Zehnder ERV)
- unlimited hot water

##### Air & Moisture Control
- water-tight, breathable envelope
- passive house level air sealing
- balanced ventilation
- sheep's wool to buffer moisture
- breathable wood finishes

##### Chemical Resistance
- No drywall or paint
- no foam
- no carpet
- VOC-absorbing materials (like wool)
- polished concrete floors
- natural materials

##### Lighting
- all low voltage lighting
- low EMF lighting
- dynamic lighting day to night
- reduced overhead evening lighting
- orientation-first glazing placement

##### Nature
- outside designed as another room
- connection to outside
- natural materials
- lush, native plants
- access to outdoor recreation`);
  return <div className="uncooked-markdown mt-12">{html}</div>;
}
