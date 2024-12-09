import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { useSchemePref } from "../hooks/useSchemePref";
import { Print } from "../components/Print";

import seedNo1LightImg from "../images/seeds/seed-no-1-light.svg";

import homeStyles from "../styles/home.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
];

export default function SeedNo1() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container">
          <img
            src={isDark ? seedNo1LightImg : seedNo1LightImg}
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
              is why We try and understand how the built environment can help
              foster these precious experiences.
            </p>
            <p>
              We welcome you to join us on a journey of learning as we seek to
              build this home.
            </p>
            <p>Cheers,</p>
            <p>-Gerald, Austin, James</p>
          </div>
          <div className="mt-16 flex gap-4">
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
        </div>
      </div>
      <Footer title="Suggestions?">
        We are always looking to add more to our collection.
      </Footer>
    </Layout>
  );
}
