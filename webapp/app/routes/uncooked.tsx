import { LinksFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Layout } from "../components/layout";
import uncookedLightImg from "../images/uncooked/uncooked-light.svg";
import { getUncookedIngredients } from "../data/uncooked";
import type { Ingredient, IngredientType } from "../data/uncooked";
import { useMemo } from "react";
import { formatDate } from "../util/date";

import uncookedStyles from "../styles/uncooked.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: uncookedStyles },
];

export default function Uncooked() {
  const data = useMemo(() => getUncookedIngredients(), []);
  return (
    <Layout>
      <div className="container mx-auto max-w-screen-sm font-mono">
        <img src={uncookedLightImg} alt="uncooked" className="-ml-20 pb-16" />
        {data.ingredients.map((i) => {
          switch (i.type) {
            case "newspaper-clipping":
              return <NewspaperClipping clipping={i} />;
          }
          return null;
        })}
      </div>
    </Layout>
  );
}

type NewspaperClippingProps = {
  clipping: Ingredient;
};
function NewspaperClipping({ clipping }: NewspaperClippingProps) {
  const { title, type, author, date, body, id } = clipping;
  return (
    <div>
      <div className="flex justify-between pb-4">
        <h3 className="font-bold">{title}</h3>
        <span>
          by: {author}, {formatDate(date)}
        </span>
      </div>
      <p className="pb-4">{body}</p>
      <UncookedLink to={`/uncooked/${id}`}>
        {formatUncookedIdToText(id, type)}
      </UncookedLink>
    </div>
  );
}

function UncookedLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="uncooked-link">
      {children}
    </Link>
  );
}

function formatUncookedIdToText(id: string, type: IngredientType): string {
  const parts = id.split("-");
  const lastPart = parts[parts.length - 1];
  return `${getTextByIngredientType(type)} No.${lastPart}`;
}

function getTextByIngredientType(type: IngredientType) {
  switch (type) {
    case "newspaper-clipping":
      return "Newspaper Clipping";
    case "betamax":
      return "Betamax";
    case "print":
      return "Print";
    case "view-master-rell":
      return "View-Master Reel";
  }
  return "";
}
