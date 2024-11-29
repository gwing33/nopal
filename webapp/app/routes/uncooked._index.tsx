import { LinksFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Layout } from "../components/layout";
import uncookedLightImg from "../images/uncooked/uncooked-light.svg";
import uncookedDarkImg from "../images/uncooked/uncooked-dark.svg";
import { getUncookedIngredients } from "../data/uncooked";
import type { Ingredients, Ingredient, IngredientType } from "../data/uncooked";
import { formatDate } from "../util/date";
import { useSchemePref } from "../hooks/useSchemePref";

import uncookedStyles from "../styles/uncooked.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: uncookedStyles },
];

export const loader = async () => {
  return getUncookedIngredients();
};

export default function Uncooked() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  const data = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="pr-4 pl-4">
        <div className="container mx-auto max-w-screen-sm font-mono">
          <img
            src={isDark ? uncookedDarkImg : uncookedLightImg}
            alt="uncooked"
            className="-ml-20 pb-16"
          />
          {(data?.ingredients || []).map((i) => {
            switch (i.type) {
              case "newspaper-clipping":
                return <NewspaperClipping key={i.id} clipping={i} />;
              case "print":
                return <Print key={i.id} print={i} />;
            }
            return null;
          })}
        </div>
      </div>
    </Layout>
  );
}

type PrintProps = {
  print: Ingredient;
};
function Print({ print }: PrintProps) {
  const { title, type, author, date, body, id, instagramId } = print;
  return (
    <div className="pb-4">
      <div className="flex">
        <img
          src={`/app/images/uncooked/${id}.jpeg`}
          alt={title}
          height="356px"
          width="356px"
        />
        <div className="pl-4">
          <h3 className="font-bold pb-4">{title}</h3>
          <div className="pb-4">
            by: {author}, {formatDate(new Date(date))}
          </div>
          <p className="pb-4">{body}</p>
          <UncookedLink instagramId={instagramId} to={`/uncooked/${id}`}>
            {formatUncookedIdToText(id, type)}
          </UncookedLink>
        </div>
      </div>
    </div>
  );
}

type NewspaperClippingProps = {
  clipping: Ingredient;
};
function NewspaperClipping({ clipping }: NewspaperClippingProps) {
  const { title, type, author, date, body, id, instagramId } = clipping;
  return (
    <div className="pb-8">
      <div className="flex justify-between pb-4">
        <h3 className="font-bold">{title}</h3>
        <span>
          by: {author}, {formatDate(new Date(date))}
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
  instagramId,
  to,
  children,
}: {
  to: string;
  instagramId?: string;
  children: React.ReactNode;
}) {
  if (instagramId) {
    return (
      <a
        href={`https://www.instagram.com/p/${instagramId}`}
        target="_blank"
        className="uncooked-link"
      >
        {children}
      </a>
    );
  }
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
