import { LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";

import seedsStyles from "../styles/seeds.css?url";
import { Link, Outlet } from "@remix-run/react";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: seedsStyles },
];

export default function Seeds() {
  return (
    <div className="w-full h-lvh flex flex-col items-center">
      <Layout />
      <div className="max-w-md flex-grow flex flex-col justify-center">
        <Seed
          title="Home"
          scientificName="(pirum domus)"
          no={1}
          desc="The heart is where the home is."
        />
        <div className="home-varn mt-8 mb-8">
          <div className="home-line" />
          <div className="varn-line" />
        </div>
        <Seed
          title="Coming soon"
          scientificName=""
          no={2}
          desc="Experiences yet to be discovered."
        />
      </div>
    </div>
  );
}

function Seed({
  title,
  scientificName,
  desc,
  no,
}: {
  title?: string;
  scientificName?: string;
  desc?: string;
  no?: number;
}) {
  return (
    <div className="flex gap-2 flex-col">
      <div className="flex items-center">
        <h2 className="font-bold text-lg">{title}</h2>
        <span className="ml-2">{scientificName}</span>
      </div>
      <p>{desc}</p>
      {no == 1 ? (
        <Link to={`/seeds/no-${no}`} className="link">
          Seed No.{no}
        </Link>
      ) : (
        <span>Seed No.{no}</span>
      )}
    </div>
  );
}
