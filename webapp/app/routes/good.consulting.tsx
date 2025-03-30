import { Layout } from "../components/Layout";
import goodsStyles from "../styles/goods.css?url";
import { LinksFunction } from "@remix-run/node";
import { FooterDiscovery } from "../components/Footer";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: goodsStyles },
];

export default function GoodConsulting() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container px-4">
          <h1 className="purple-light-text text-4xl mt-16">
            Good Building Science & Consulting
          </h1>
          <p className="text-xl mt-4 mb-4">
            We exist to change the culture of construction. To bring back the
            pride in our craft. To inspire people to live better lives through
            creating community and enjoyable places to inhabit. Everything we do
            is knitted together by best practices in low carbon, healthy,
            durable, high performance building.
          </p>

          <h2 className="green-text text-3xl mt-16">
            Enclosure & Mechanical System
          </h2>
          <p className="text-xl mt-4 mb-4">
            Modern high performance enclosure systems have delivered energy
            efficiency, but have fell short in terms of health, durability, and
            lifecycle carbon impact. We specialize in carbon storing healthy
            materials integrated into systems that will last for hundreds of
            years.
          </p>
          <p className="text-xl mt-4 mb-4">
            Once the enclosure is dialed in then we need to include badass
            mechanical systems. We specialize in energy recovery ventilation,
            hyper efficient heating/cooling, and insanely efficient hot water
            systems.
          </p>

          <p className="text-xl mt-4 mb-4">
            Around $3-6k /mo for us to be your in-house building nerds.
          </p>

          <h3 className="purple-light-text text-xl">Modeling Services</h3>
          <p className="text-xl mt-4 mb-4">
            Understanding performance of a building is important, so we can help
            you out there.
          </p>
          <ol>
            <li>WUFI Passive, $3k+</li>
            <li>WUFI Pro, $1,200 per assembly</li>
            <li>BEAM Carbon Accounting, $3k+</li>
          </ol>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
