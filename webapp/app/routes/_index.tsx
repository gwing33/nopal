import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Link } from "@remix-run/react";

import styles from "../styles/home.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function Index() {
  return (
    <Layout>
      <div
        style={{ height: "75vh" }}
        className="scene1 flex items-start md:items-center justify-center"
      >
        <div className="mt-20 md:mt-0 p-10 md:p-20">
          <h1 className="text-4xl">Homes built for Humans</h1>
          <p style={{ maxWidth: "480px" }} className="text-lg mt-4 mb-4">
            Our homes are built so you can focus on your life all while using
            materials thoughtfully to enhance air quality and reduce energy
            consumption.
          </p>
          <Link className="btn-primary" to="/explore">
            Explore
          </Link>
        </div>
      </div>
      <Footer title="Questions?">
        Owning a home can be challenging, that is why we believe people should
        be able to ask questions, learn and improve their own home at their own
        pace.
      </Footer>
    </Layout>
  );
}
