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
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
