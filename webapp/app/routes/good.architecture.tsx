import { Layout } from "../components/Layout";
import projectStyles from "../styles/project.css?url";
import goodsStyles from "../styles/goods.css?url";
import homeStyles from "../styles/home.css?url";
import { LinksFunction } from "@remix-run/node";
import { FooterDiscovery } from "../components/Footer";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
  { rel: "stylesheet", href: goodsStyles },
];

export default function GoodArchitecture() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container uncooked-markdown mt-20 md:mt-0 p-10 md:p-20">
          <h1>Good Design & Architecture</h1>
          <p>
            An exciting alternative to the contemporary architecture process.
            Instead of being focused on art, and satisfying the ego of the
            architect.
          </p>

          <div className="flex gap-4">
            <div className="good-box p-4">$36k+ for retrofits</div>
            <div className="good-box p-4">$60k+ for ground up design</div>
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
