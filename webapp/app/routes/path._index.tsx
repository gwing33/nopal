import { AudioFormat } from "../components/AudioFormat";
import { NopalBusinessCycle } from "../svg/path/NopalBusinessCycle";
import {
  CactiOne,
  CactiTwo,
  CactiThree,
  CactiFour,
  CactiFive,
} from "../svg/path/cacti";

export default function PathPage() {
  return (
    <>
      <div className="pt-16 uncooked-markdown">
        <p>All journeys require preparation and a north star.</p>
        <blockquote>
          We focus on inspiring humanity to live better by building healthy
          homes that are inspired by nature.
        </blockquote>
        <p>
          <AudioFormat />
        </p>

        <h2 className="cacti-one-heading">
          <CactiOne /> A Fragmented Understanding
        </h2>
        <p>
          Our industry has splintered into fragmented understanding. The few
          people that see the whole aren’t doing the hands on work, separated by
          regulations and meetings.
        </p>
        <p>
          Bolting on high performance has become a common path to achieve more
          resilient and healthy buildings. While the results can be positive,
          the added complexity leads to increased cost, complication and
          uncertainty.
        </p>

        <h2 className="cacti-two-heading">
          <CactiTwo />A Path Finder
        </h2>
        <p>
          At Nopal, we focus on bringing these fragments into a clear whole,
          through a complete system.
        </p>
        <ul>
          <li>Material science helps us navigate the rules & regulations</li>
          <li>
            Atomic teams work in a bottom up approach, enabling craftsmanship
            and apprenticeship
          </li>
          <li>
            Smaller projects like ADUs & single-family homes offer quicker
            feedback loops
          </li>
        </ul>
        <p className="mb-8">
          This foundation will go into practice with our first full-system home
          build starting in Spring of 2025.
        </p>
        <NopalBusinessCycle />
        <h3 className="cacti-three-heading">
          <CactiThree />
          What We Are Looking For
        </h3>
        <p>Investors or on-contract buyers for builds #2-10.</p>

        <p>These first 10 builds enable us to:</p>
        <ul>
          <li>Refine our education and community approach</li>
          <li>Grow the Team</li>
          <li>Scale up our Baselayer system</li>
          <li>Start warehousing and prefab operations</li>
          <li>Improve our project management software</li>
        </ul>
        <h3 className="cacti-four-heading">
          <CactiFour />
          The Future is Multi
        </h3>
        <p>
          Based on our research, about 40 people per acre make the ideal density
          for thriving communities.
        </p>
        <p>
          Multifamily or larger units that embody this are projects we want to
          grow into. Developing our atomic teams and building approach takes
          time and we don’t intend on rushing this. After our first 10 homes we
          will be looking to jump into this market with unparalleled confidence.
        </p>
        <h3 id="faq" className="cacti-five-heading">
          <CactiFive />
          FAQ
        </h3>
        <div className="z-10 relative pb-8 faq">
          <p>
            <a href="/path/faq-1">
              {">"} How much more does it cost to build this way?
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
