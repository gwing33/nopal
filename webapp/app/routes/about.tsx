import { Link } from "@remix-run/react";
import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";
import { LinksFunction } from "@remix-run/node";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: projectStyles },
];

export default function About() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container">
          <h1 className="purple-light-text text-4xl">Who We Are</h1>
          <p className="text-xl mt-4 mb-4">
            Nature guides and inspires Nopal, from the materials we use and how
            we assemble them to the way we collaborate with other humans and the
            land.
          </p>
          <p className="text-xl mt-4 mb-4">
            Austin, James, Gerald and Lucas came together to weave our
            experience into comprehensive services to help others build and live
            a rich and calm life.
          </p>
          <p className="text-xl mt-4 mb-4">
            We've created the 5 factors of good building to guide us to be
            responsible stewards of the regenerative housing movement.
          </p>
          <h2 className="green-text text-2xl mt-16">The Team</h2>
          <Profile name="Austin Trautman" title="CEO">
            <p className="text-xl mt-4 mb-4">
              Sitting on a beach at the bottom of the Grand Canyon, 3 days from
              my last indoor meal, I had a realization. Magical things happen on
              days that start and end in nature, void of connection to the
              modern world. My brain was at total ease, I felt more....human, my
              challenges were clear, the world was all in balance. The power of
              “the middle day” has fascinated me for two decades, now confirmed
              by{" "}
              <a
                className="link"
                href="https://huckberry.com/journal/posts/3-days?srsltid=AfmBOoomKIjGbRnKP6VBR2xkPF2gcDisb5MapqEFNV_3iqnxSsUG6Hbq"
                target="_blank"
                rel="noopener noreferrer"
              >
                recent scientific findings
              </a>
              .
            </p>

            <p className="text-xl mt-4 mb-4">
              While intense curiosity has driven me down many rabbit holes over
              the past 15 years. One question has always floated above the rest;{" "}
              <em>“how do we bring the magic of nature into our homes?”</em>
            </p>
          </Profile>
          <Profile name="Gerald Leenerts" title="Systems Craftsman">
            <p className="text-xl mt-4 mb-4">
              Back on my Grandpa's farm, I fell in love with nature without
              knowing it. It wasn't a specific aspect but rather the collective.
              Sometimes nature was full of life and other times it struggled to
              survive. Worst was to see how we humans tried to force nature to
              adapt to our approach to life.
            </p>
            <p className="text-xl mt-4 mb-4">
              <a
                className="link"
                href="https://www.goodreads.com/book/show/3828902-thinking-in-systems"
                target="_blank"
                rel="noopener noreferrer"
              >
                Thinking in systems
              </a>{" "}
              is direct reflection of my interest and love for nature. I am
              constantly playing with natural materials as I look to answer my
              question;{" "}
              <em>
                "Is it possible to create a home that is focused on modern human
                comfort while also being considerate of our climate?"
              </em>
            </p>
          </Profile>
          {/*
            <Profile name="James Werhanowicz"></Profile>
            <Profile name="Lucas Johnson"></Profile>
          */}

          <div className="mt-16">
            <Link to="/contact" className="btn-primary">
              Contact us
            </Link>
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}

function Profile({
  name,
  title,
  children,
}: {
  name: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="profile mt-8">
      <h3 className="font-bold text-xl">{name}</h3>
      <div className="purple-light-text">{title}</div>
      {children}
    </div>
  );
}
