import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { useMarkdown } from "../hooks/useMarkdown";

import homeStyles from "../styles/home.css?url";
import projectStyles from "../styles/project.css?url";
import pathStyles from "../styles/path.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
  { rel: "stylesheet", href: pathStyles },
];

const topBody = `# Preparing
All journeys require preparation and a north star.

> We focus on inspiring humanity to live better by building healthy homes that are inspired by nature.

## A Fragmented Understanding
The industry has fragmented our understanding of the way we construct buildings. The few people that do understand the wholistic view aren’t doing the work and are distracted by rules & regulations or meetings & appointments.

Building a high performance home significantly exceeds code requirements. Going beyond high performance into sustainability, durability and resilience only adds to the complex spiderweb of things you need to know.

## A Path Finder
At Nopal we focus on providing solutions to this fragmentation.

- Material science helps us navigate the rules & regulations.
- Atomic teams work in a bottom up approach which enable a level of craftsmanship and apprenticeship.
- Smaller projects like ADUs & Homes offer quicker feedback loops.

This is being put into practice on our first home build starting in March/April of 2025.`;

const bottomBody = `## What we need now
Investors or buyers for builds #2-10.

These first 10 builds enable us to develope the following:
- Refine our education and community approach
- Grow the Team
- Scale up our Baselayer system
- Start warehousing and prefab operations
- Improve our project management software

## The Future is Multi
Based on our research, about 40 people per acre make the ideal density for thriving communities.

Multifamily or larger units that embody this are projects we want to grow into. Developing our atomic teams and building approach takes time and we don’t intend on rushing this. After our first 10 homes we will be looking to jump into this market with unparalleled confidence.`;

export default function PathPage() {
  const topBodyHtml = useMarkdown(topBody);
  const bottomBodyHtml = useMarkdown(bottomBody);
  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container mt-8">{topBodyHtml}</div>
        <div className="simple-container flex justify-center mt-8">
          <NopalBusinessCycle />
        </div>
        <div className="simple-container mt-8">{bottomBodyHtml}</div>
      </div>
      <Footer title="Want to join us?">
        We can travel together on this venture down the path of the unknown.
      </Footer>
    </Layout>
  );
}

function NopalBusinessCycle() {
  return (
    <svg
      width="563"
      height="383"
      viewBox="0 0 563 383"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="244" cy="154" r="82.5" fill="#5DA06D" />
      <path
        d="M282.175 184.833C273.622 184.38 269.724 181.531 269.573 179.541C269.409 177.377 274.194 173.294 281.419 171.338C287.758 169.621 293.362 173.248 294.953 178.319C296.545 183.391 288.756 185.182 282.175 184.833Z"
        fill="white"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M274.34 169.646C287.578 169.646 298.31 158.914 298.31 145.676C298.31 132.437 287.578 121.705 274.34 121.705C261.101 121.705 250.369 132.437 250.369 145.676C250.369 158.914 261.101 169.646 274.34 169.646ZM274.34 158.366C281.349 158.366 287.03 152.684 287.03 145.675C287.03 138.667 281.349 132.985 274.34 132.985C267.331 132.985 261.65 138.667 261.65 145.675C261.65 152.684 267.331 158.366 274.34 158.366Z"
        fill="#F9F2DC"
      />
      <path
        d="M190 173.171V184.451H222.783V173.171H212.56V140.388C213.97 138.625 222.783 132.985 230.538 132.985C236.742 132.985 237.941 137.215 237.941 140.388L238.294 184.451H260.501V173.171H249.221V133.69C249.221 129.108 243.934 121 233.711 121C225.533 121 215.968 127.345 212.56 129.813V122.41H190V132.985H200.223V173.171H190Z"
        fill="#F9F2DC"
      />
      <path
        d="M472.065 177.997C472.065 177.997 486.089 237 486.089 303.809C486.089 320.245 486.431 345.894 486.431 345.894M486.431 345.894L475.54 334.605C474.286 333.305 475.262 331.139 477.067 331.218L495.926 332.04C497.682 332.117 498.492 334.258 497.228 335.478L486.431 345.894Z"
        className="svgArrow"
      />
      <path
        d="M181 305.031C181 305.031 178.287 303.65 154.659 319.229C141.84 327.681 126 346 126 346M126 346L140.363 346C142.177 346 143.054 343.778 141.728 342.539L129.366 330.981C128.088 329.786 126 330.692 126 332.442L126 346Z"
        className="svgArrow"
      />
      <path
        d="M366.412 344.642C366.412 344.642 366.774 341.619 344.007 324.807C331.654 315.685 309 307.128 309 307.128M309 307.128L313.949 320.611C314.574 322.314 316.962 322.372 317.668 320.701L324.259 305.113C324.94 303.501 323.37 301.853 321.728 302.456L309 307.128Z"
        className="svgArrow"
      />
      <circle cx="245" cy="153" r="147.5" className="svgArrow" />
      <rect x="153" width="188" height="38" className="svgRect" />
      <rect x="180" y="280" width="129" height="38" className="svgRect" />
      <rect x="357" y="130" width="54" height="46" className="svgRect" />
      <rect x="81" y="130" width="54" height="46" className="svgRect" />
      <path
        d="M152.255 52.5311L153.536 36.8976L138.584 35.6724C136.833 35.5289 135.761 37.5517 136.863 38.9202L148.704 53.6222C149.837 55.0293 152.107 54.3317 152.255 52.5311Z"
        className="svgArrow"
      />
      <path
        d="M377.727 121.47L390.918 129.959L399.036 117.343C399.987 115.865 398.706 113.968 396.98 114.296L378.435 117.824C376.661 118.161 376.208 120.493 377.727 121.47Z"
        className="svgArrow"
      />
      <path
        d="M313.002 271.258L308.509 286.287L322.882 290.584C324.566 291.087 326.034 289.33 325.239 287.763L316.702 270.927C315.885 269.315 313.519 269.527 313.002 271.258Z"
        className="svgArrow"
      />
      <path
        d="M112.051 183.603L98.9247 175.015L90.7111 187.568C89.749 189.039 91.0148 190.946 92.7435 190.631L111.314 187.244C113.092 186.92 113.562 184.592 112.051 183.603Z"
        className="svgArrow"
      />
      <text xml:space="preserve" className="svgTextMono">
        <tspan x="374" y="159.898">
          Atomic Teams
        </tspan>
      </text>
      <text xml:space="preserve" className="svgTextMono">
        <tspan x="194" y="300.898">
          Baselayer
        </tspan>
      </text>
      <text xml:space="preserve" className="svgTextMono">
        <tspan x="0" y="159.898">
          Home {"&"} ADU
        </tspan>
      </text>
      <text xml:space="preserve" className="svgTextMono">
        <tspan x="72" y="18.8984">
          Education, Classes {"&"} Consulting
        </tspan>
      </text>
      <text xml:space="preserve" className="svgTextHand">
        <tspan x="33" y="370">
          Multifamily
        </tspan>
      </text>
      <text xml:space="preserve" className="svgTextHand">
        <tspan x="362" y="370">
          Warehousing / Prefab
        </tspan>
      </text>
    </svg>
  );
}
