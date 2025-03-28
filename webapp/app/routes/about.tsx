import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";

export default function About() {
  return (
    <Layout>
      <div className="scene0">
        <h1>Who We Are</h1>
        <p>
          All of us have learned from nature, Nopal is no different. From the
          materials we use to how we apply them to the collaboration with others
          and the land, we look to nature to help guide us down this path.
        </p>

        <p>
          Austin, James, Gerald and Lucas came together to help others build
          better homes and educate others on what nature offers us.
        </p>

        <p>
          We've created the 5 factors of good building to help us strive to
          become responsible stewards of the regenerative housing movement.
        </p>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
