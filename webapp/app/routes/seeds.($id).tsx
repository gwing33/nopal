import { LinksFunction } from "@remix-run/node";
import { Layout, Footer } from "../components/layout";

import homeStyles from "../styles/home.css?url";
import seedsStyles from "../styles/seeds.css?url";
import { ReactNode } from "react";
import { Link, useParams } from "@remix-run/react";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: seedsStyles },
];

export default function Seeds() {
  const params = useParams();
  const id = params?.id ? Number(params.id.replace("no-", "")) : null;
  return (
    <div className="w-full h-lvh flex flex-col items-center gap-4">
      <Layout />
      <div className="max-w-md flex-grow flex flex-col justify-center">
        <div>
          {id == null || id == 1 ? (
            <Seed title="Home" no={1}>
              The heart is where the home is.
            </Seed>
          ) : null}
          {!id && (
            <div className="home-pup mt-8 mb-8">
              <div className="home-line" />
              <div className="pup-line" />
            </div>
          )}
          {id == null || id == 2 ? (
            <Seed title="Pup" no={2}>
              The home is where the heart is.
            </Seed>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Seed({
  title,
  children,
  no,
}: {
  title?: string;
  children?: ReactNode;
  no?: number;
}) {
  return (
    <div className="flex gap-2 flex-col">
      <h2 className="font-bold text-lg">{title}</h2>
      <p>{children}</p>
      <Link
        to={`/seeds/no-${no}`}
        style={{ color: "var(--green)" }}
        className="hover:underline"
      >
        Seed No.{no}
      </Link>
    </div>
  );
}
