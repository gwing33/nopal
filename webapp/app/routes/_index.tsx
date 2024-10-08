import { LinksFunction } from "@remix-run/node";
import { Layout, ContactUsLinks, Footer } from "../components/layout";
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
      <div className="scene0">
        <div className="scene0-bg" />
        <div className="scene0-shadow-bg" />
        <div className="scene0-pricklyPearFruit" />
        <div className="flex items-center justify-center h-full md:justify-end md:items-start">
          <div className="scene0-content flex items-end justify-center flex-col p-10 lg:p-20">
            <h2 className="text-2xl">Questions?</h2>
            <p className="text-base max-w-96 mt-4 mb-4 text-right">
              Owning a home can be challenging, that is why we believe people
              should be able to ask questions, learn and improve their own home
              at their own pace.
            </p>
            <ContactUsLinks />
          </div>
        </div>
        <Footer />
      </div>
    </Layout>
  );
}
