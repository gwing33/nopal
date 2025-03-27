import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";

export default function About() {
  return (
    <Layout>
      <div className="scene0">
        <h1>About</h1>
        <p>This is the about page.</p>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
