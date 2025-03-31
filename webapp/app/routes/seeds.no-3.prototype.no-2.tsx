import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Print } from "../components/Print";
import { useSchemePref } from "../hooks/useSchemePref";

import seedNo3LightImg from "../images/seeds/seed-no-3-prototype-no-2-light.svg";
import seedNo3DarkImg from "../images/seeds/seed-no-3-prototype-no-2-dark.svg";

import seedsStyles from "../styles/seeds.css?url";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: projectStyles },
  { rel: "stylesheet", href: seedsStyles },
];

export default function SeedNo2() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";

  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container">
          <img
            src={isDark ? seedNo3DarkImg : seedNo3LightImg}
            alt="Seed No.1"
            className="mt-8 md:-ml-4 pb-16"
          />
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Dancing Raven Doors</h2>
            <p>
              With Our Doors we focus on the complete experience. Design is a
              key element but not the complete picture of what a door does.
            </p>
            <p>
              When you enter a home as a guest, this is similar to shaking
              someone's hand for the first time. It should be firm yet offer a
              sense of comfort and confidence.
            </p>
            <p>The door sets the tone for the rest of the home.</p>
            <a
              className="link"
              href="https://www.loom.com/share/bdf3fa83f4194bc48f2834efcda80037?sid=d4d88f51-663f-4404-87f6-e8f4b46b3c45"
              target="_blank"
            >
              Watch Video Overview
            </a>
          </div>
          <div className="mt-16">
            <h2 className="text-lg font-bold">Visual Materials</h2>
            <p className="mb-4">
              There are two main materials, white oak and brass.
            </p>
            <WhiteOak />
            <HandleMaterial />
          </div>

          <div className="mt-16">
            <h2 className="text-lg font-bold">Exterior Door Form</h2>
            <p className="mb-4">
              This door is an exterior swing door with the handle on the left as
              you approach it. The door should end up at 8' tall and 36" wide
              with concealed hinges.
            </p>
            <ExteriorDoorOverview isDark={isDark} />
            <p className="italic">
              Note: These oak planks need expansion joints otherwise they will
              potentially become an issue for the door functioning as seasons
              change.
            </p>

            <h4 className="font-bold mt-16">Plan View</h4>
            <p>
              Below is the view looking from the top down to better illustrate
              the shape of the door and frame. While this is a work in progress
              this should look the same on both the latch and hinge side of the
              door.
            </p>
            <p className="mt-4">
              Note that the width of the frame and door are in the same plane.
            </p>
            <img
              className="mt-4"
              src="/seed-no-3-prototype-no-2/plan-view-no-2.jpeg"
              alt="Plan View"
            />
          </div>

          <div className="mt-16">
            <h2 className="text-lg font-bold">Product List</h2>
            <ul className="list-disc ml-4">
              <li>
                <a
                  className="link"
                  target="_blank"
                  href="https://www.tectushinges.com"
                >
                  Tectus Hinges
                </a>
                : $180-$280ea, 3 needed
              </li>
              <li>
                <a
                  className="link"
                  target="_blank"
                  href="https://deltana.net/catalog/catches/viewing/roller-catches-solid-brass-/244_roller-catch-hd"
                >
                  Deltana Roller Catch
                </a>
                : $40.50-$49.50ea, 2 needed
              </li>
              <li>
                <a
                  className="link"
                  target="_blank"
                  href="https://www.pemko.com/en/products/astragals-meeting-stiles/adjustable-astragals/product-details.aehpdp-273-fg-series-ag_pemko_301934"
                >
                  Pemko 273x224 FGT Threshold
                </a>
                : White $133.50ea, 1 needed.
                <ul>
                  <li className="italic ml-4">
                    Note brass option is no longer made by Pemko
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="mt-16">
            <h2 className="text-lg font-bold">Interior Door</h2>
            <p>
              The interior door will have a lot of the same elements. For
              example the thickness and look of the door should be the same,
              however interior doors don't need gaskets.
            </p>
            <p className="mt-4">
              The door opening also needs additional consideration that is
              currently being worked through, like how to cover the plastic
              framing, where to position the door in the frame (if not center,
              why?) and how the different ceiling heights will interact with the
              door.
            </p>
            <p className="mt-4">
              In due time I'll have a design proposal that will need it's own
              review.
            </p>
          </div>
        </div>
      </div>
      <Footer title="Nurturing">
        This seed is a work in progress but reach out with feedback or thoughts!
      </Footer>
    </Layout>
  );
}

function WhiteOak() {
  return (
    <div className="pb-4 print">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex-shrink-0"
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          <img src="/seed-no-3-prototype-no-2/white-oak.png" alt="White Oak" />
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">White Oak</h3>
          <p>The primary material you'll visually see will be white oak.</p>
          <p className="mt-4">
            The finish (oil or similar) on the white oak is yet to be
            determined.
          </p>
        </div>
      </div>
    </div>
  );
}

function HandleMaterial() {
  return (
    <div className="pb-4 print">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex-shrink-0"
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          <img
            src="/seed-no-3-prototype-no-2/half-moon-pulls.png"
            alt="Half Moon Pulls"
          />
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">Brass</h3>
          <p>
            The handles offer up a soft touch while providing a rich gold-like
            color.
          </p>
          <p className="mt-4">
            The exterior door will be a half moon pull while the interior door
            is a lever style{" "}
            <a
              className="link"
              href="https://www.dndhandles.it/en/products/handles-for-doors/ginkgo/"
              target="_blank"
            >
              handle from DND
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function ExteriorDoorOverview({ isDark }: { isDark?: boolean }) {
  const src = isDark
    ? "/seed-no-3-prototype-no-2/exterior-door-overview-dark.svg"
    : "/seed-no-3-prototype-no-2/exterior-door-overview-light.svg";
  return (
    <div className="mt-8 pb-4">
      <img style={{ width: "100%" }} src={src} alt="Half Moon Pulls" />
    </div>
  );
}
