import { AudioFormat } from "../components/AudioFormat";
import { Link } from "@remix-run/react";
import { BackArrow } from "../svg/arrows/BackArrow";
import {
  CactiOne,
  CactiTwo,
  CactiThree,
  CactiFour,
  CactiFive,
} from "../svg/path/cacti";
import { Annotation } from "../components/Annotation";

export default function PathFaqTwo() {
  return (
    <div className="pt-16 uncooked-markdown">
      <h1 className="italic">{">"} What is this "Baselayer"?</h1>
      <p>
        <AudioFormat />
      </p>

      <p>
        Similar to long johns, our baselayer is focused on keeping you comfy.
        It's the framing, insulation, control layers as well as the mechanical
        system.
      </p>
      <p>
        You can think of the baselayer as a fully functioning building with no
        finishes.
      </p>
      <Annotation left>
        Not too big and not too small, it's juuust right.
      </Annotation>
      <h2 className="cacti-one-heading">
        <CactiOne />
        Medium Timber Framing
      </h2>
      <p>We've looked at the 3 common approaches to building with wood:</p>
      <ol>
        <li>Timber Framing</li>
        <li>Stick Framing</li>
        <li>Pole Building Framing</li>
      </ol>
      <p>
        Each of them have something we value but missed the mark in one or more
        ways.
      </p>
      <p>
        We decided to take the parts we liked and then optimize it for
        performance, precision and cost.
      </p>
      <ul>
        <li>
          Wooden joints similar to timber framing offer a more resilient build
        </li>
        <li>
          Off-the-shelf materials used for stick framing keep the cost down
        </li>
        <li>Pole building framing's approach enables large open spaces</li>
      </ul>
      <p>
        To make this all performant, we reduced the thermal bridging to under
        5%. For comparison advanced stick framing is 15% with regular stick
        framing sometimes getting as high as 30%.
      </p>
      <p>
        Our prefab posts can be built off site or onsite with minimal tooling
        (less than $200). This prefab work actually improved the precision
        issues we see with using standard lumber in stick framing
      </p>
      <p>
        Because of how we orient the posts, we don't need to drill for wires
        wires or plumbing either. This means our walls need little modification
        once everything is framed.
      </p>

      <h2 className="cacti-two-heading">
        <CactiTwo />
        Insulation
      </h2>
      <p>We use 3 types of insulation:</p>
      <ol>
        <li>
          TimberHP's wood fiber insulation offers great r-value but because it's
          density, it manages temperature fluctuations much better than foam.
        </li>
        <li>
          Havelock's sheep's wool: This is a great product for keeping the air
          clean while also functioning as a humidity buffer.
        </li>
        <li>
          Rockwool is used just for fire blocking. We use just what we need to
          and no more.
        </li>
      </ol>
      <p>
        Because these are all rigid insulations, they are precut and fit perfect
        into the wall assembly, meaning little work to fix it in place is
        needed.
      </p>

      <h2 className="cacti-three-heading">
        <CactiThree />
        Air Sealing or Control Layers
      </h2>
      <p>There are 3 critical aspects of air sealing:</p>
      <ol>
        <li>Below grade vapor barrier</li>
        <li>Transitions, gound to wall, wall to roof.</li>
        <li>Penetrations...</li>
      </ol>
      <p>
        We use pro-clima products for most of our air sealing. They offer the
        highest performance for vapor permeability all while using non-toxic
        chemicals. They are easy to work with.
      </p>
      <p>
        Because of how we build, we always have access to repair any damage done
        to our control layers. This is something we see all too much of in
        traditional builds, sadly trades aren't use to air sealing outside of a
        can of spray foam which should never be used.
      </p>

      <h3 className="cacti-four-heading">
        <CactiFour />
        Mechanicals
      </h3>
      <p>
        Because of how performant this envelope is, we are able to do radiant
        cooling which is more energy efficient and self balancing. This
        increases the comfort in the home.
      </p>
      <p>
        We also use the best ERV on the market, Zehnder. It's going to
        continuously bring in fresh air while filtering and dehumidifying if
        needed.
      </p>

      <h3 className="cacti-five-heading">
        <CactiFive />
        The Future
      </h3>
      <p>
        We don't plan on stopping here. We are a curious group of builders
        constantly reviewing and evaluating ways to improve the system. We will
        continue to reduce the cost, improve the performance and expand the
        capabilities of our baselayer.
      </p>
      <p>
        We are also working on supporting additional climates beyond the Sonoran
        desert.
      </p>
      <p>
        If you're interested in learning more, let us know as we are planning on
        sharing all our information freely.
      </p>
      <p className="mt-8 z-10 relative">
        <Link
          to="/path#faq"
          className="font-hand text-xl inline-flex items-center gap-2 -ml-8"
        >
          <BackArrow />
          Back to the Path
        </Link>
      </p>
    </div>
  );
}
