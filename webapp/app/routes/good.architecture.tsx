import { Layout } from "../components/Layout";
import goodsStyles from "../styles/goods.css?url";
import { LinksFunction } from "@remix-run/node";
import { FooterDiscovery } from "../components/Footer";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: goodsStyles },
];

export default function GoodArchitecture() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container mt-12 p-4">
          <h1 className="purple-light-text text-4xl">
            Good Design & Architecture
          </h1>
          <p className="text-xl mt-4">
            We collaborate to create truly good homes: combining art, high
            performance design, and the healthiest materials.
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
