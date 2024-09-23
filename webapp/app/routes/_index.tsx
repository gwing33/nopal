import { LinksFunction, json, type LoaderFunctionArgs } from "@remix-run/node";
import { Layout } from "../components/layout";

import styles from "../styles/home.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function Index() {
  return (
    <Layout>
      <div className="main-cta flex items-center justify-center">
        <div style={{ marginRight: "25%" }}>
          <h1 className="text-4xl">Homes built for Humans</h1>
          <p style={{ width: "480px" }} className="text-lg mt-4 mb-4">
            Our homes are built so you can focus on your life all while using
            materials thoughtfully to enhance air quality and reduce energy
            consumption.
          </p>
          <a className="btn-primary" href="#todo">
            Price a new House →
          </a>
        </div>
      </div>
      <div className="second-cta">
        <h2 className="text-2xl">Questions?</h2>
        <p className="text-base  max-w-96">
          Owning a home can be challenging, that is why we believe people should
          be able to ask questions, learn and improve their own home at their
          own pace.
        </p>
        <button>Join our Discord</button>
        <a href="#todo">Email us</a>
      </div>
    </Layout>
  );
}

// <BackRocks />
// <PricklyPearFruit />
// <PricklyPear />
// <Ocotillo />

// function BackRocks() {
//   return (
//     <div
//       className="landscape"
//       style={{
//         backgroundSize: "100% auto",
//         backgroundPosition: "80% auto",
//         backgroundImage: `url(${backRocks})`,
//       }}
//     />
//   );
// }

// function FrontRocks() {
//   return (
//     <div
//       className="landscape"
//       style={{
//         backgroundPositionY: "250px",
//         backgroundImage: `url(${frontRocks})`,
//       }}
//     />
//   );
// }

// function Ground() {
//   return (
//     <div
//       className="landscape"
//       style={{
//         backgroundPositionY: "102px",
//         backgroundImage: `url(${ground})`,
//       }}
//     />
//   );
// }

// function Home() {
//   return (
//     <div
//       className="landscape"
//       style={{
//         backgroundPositionX: "right",
//         backgroundImage: `url(${home})`,
//       }}
//     />
//   );
// }

// function PricklyPearFruit() {
//   return (
//     <div
//       className="landscape"
//       style={{
//         height: "300px",
//         backgroundImage: `url(${pricklyPearFruit})`,
//       }}
//     />
//   );
// }

// function PricklyPear() {
//   return (
//     <div
//       className="landscape"
//       style={{ height: "300px", backgroundImage: `url(${pricklyPear})` }}
//     />
//   );
// }

// function Ocotillo() {
//   return (
//     <div
//       className="landscape"
//       style={{ height: "300px", backgroundImage: `url(${ocotillo})` }}
//     />
//   );
// }
