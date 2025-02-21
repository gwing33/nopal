import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Link } from "@remix-run/react";

import styles from "../styles/home.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function Index() {
  return (
    <Layout>
      <div className="simple-container">
        <h1 className="text-4xl">Baselayer</h1>
        <div className="text-sm">noun</div>
        <p>
          a <span>piece of clothing</span> worn under your{" "}
          <span>other clothes</span>, made of <span>natural</span> material that
          is designed to keep you warm and dry.
        </p>
      </div>
    </Layout>
  );
}
