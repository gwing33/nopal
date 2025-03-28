import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";
import { LinksFunction } from "@remix-run/node";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: projectStyles },
];

export default function Contact() {
  return (
    <Layout>
      <div className="scene0">
        <div className="simple-container uncooked-markdown">
          <h1>Contact</h1>
          <ul>
            <li>
              Send us an email at{" "}
              <a className="link" href="mailto:human@nopal.build">
                human@nopal.build
              </a>
            </li>
            <li>
              Join us on{" "}
              <a
                href="https://discord.gg/avFGzMNAXu"
                target="_blank"
                className="link"
              >
                Discord
              </a>
            </li>
            <li>
              Follow us on{" "}
              <a
                href="https://www.instagram.com/nopal.build/"
                target="_blank"
                className="link"
              >
                Instagram @nopal.build
              </a>
            </li>
            <li>
              Subscribe to our{" "}
              <a
                href="https://www.youtube.com/@nopal-build"
                target="_blank"
                className="link"
              >
                Youtube channel
              </a>
            </li>
          </ul>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
