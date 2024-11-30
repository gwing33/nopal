import { LinksFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Layout, Footer } from "../components/layout";
import uncookedLightImg from "../images/uncooked/uncooked-light.svg";
import uncookedDarkImg from "../images/uncooked/uncooked-dark.svg";
import { getUncookedIngredients } from "../data/uncooked";
import type { Ingredients, Ingredient, IngredientType } from "../data/uncooked";
import { formatDate } from "../util/date";
import { useSchemePref } from "../hooks/useSchemePref";
import { useMarkdown } from "../hooks/useMarkdown";
import {
  useState,
  useCallback,
  SyntheticEvent,
  CSSProperties,
  ReactNode,
} from "react";

import homeStyles from "../styles/home.css?url";
import uncookedStyles from "../styles/uncooked.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: uncookedStyles },
];

export const loader = async () => {
  return getUncookedIngredients();
};

const DISPLAY_LIMIT = 10;

export default function Uncooked() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  const data = useLoaderData<typeof loader>();
  const [limit, setLimit] = useState(DISPLAY_LIMIT);
  const handleLoadMore = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      setLimit(limit + DISPLAY_LIMIT);
    },
    [limit]
  );
  const showLoadMore = data?.ingredients.length > limit;

  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="uncooked-container pb-10">
          <img
            src={isDark ? uncookedDarkImg : uncookedLightImg}
            alt="uncooked"
            className="md:-ml-20 pb-16"
          />
          {(data?.ingredients || []).map((i, idx) => {
            if (idx < limit) {
              switch (i.type) {
                case "newspaper-clipping":
                  return <NewspaperClipping key={i.id} clipping={i} />;
                case "print":
                  return <Print key={i.id} print={i} />;
                case "view-master-reel":
                  return <ViewMasterReel key={i.id} reel={i} />;
              }
            }
            return null;
          })}
          {showLoadMore ? (
            <button
              className="btn-secondary"
              style={{ "--btn-color": "var(--purple-light)" } as CSSProperties}
              onClick={handleLoadMore}
            >
              Load more
            </button>
          ) : (
            <div>End.</div>
          )}
        </div>
      </div>
      <Footer title="Suggestions?">
        We are always looking to add more to our collection.
      </Footer>
    </Layout>
  );
}

type PrintProps = {
  print: Ingredient;
};
function Print({ print }: PrintProps) {
  const { title, type, author, date, body, id, instagramId } = print;
  const bodyHtml = useMarkdown(body);
  return (
    <div className="pb-4 uncooked-print">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex-shrink-0"
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          <img src={`/uncooked/${id}.jpeg`} alt={title} />
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">{title}</h3>
          <div className="pb-4">
            by: {author}, {formatDate(new Date(date))}
          </div>
          {bodyHtml}
          <UncookedLink instagramId={instagramId} to={`/uncooked/${id}`}>
            {formatUncookedIdToText(id, type)}
          </UncookedLink>
        </div>
      </div>
    </div>
  );
}

type ViewMasterReelProps = {
  reel: Ingredient;
};
function ViewMasterReel({ reel }: ViewMasterReelProps) {
  const { title, type, author, date, body, id, instagramId, images } = reel;
  const bodyHtml = useMarkdown(body);
  return (
    <div className="pb-4 uncooked-view-master-reel">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-2"
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          {images?.map((img, idx) => (
            <div
              key={img}
              className="flex-shrink-0"
              style={{
                maxWidth: "174px",
                maxHeight: "174px",
              }}
            >
              <img
                src={`/uncooked/${img}.jpeg`}
                alt={`${title} slide ${idx + 1}`}
              />
            </div>
          ))}
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">{title}</h3>
          <div className="pb-4">
            by: {author}, {formatDate(new Date(date))}
          </div>
          {bodyHtml}
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
  const bodyHtml = useMarkdown(body);
  return (
    <div className="pb-8">
      <h3 className="font-bold">{title}</h3>
      <div className="pb-4">
        by: {author}, {formatDate(new Date(date))}
      </div>
      {bodyHtml}
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
  const Container = ({ children }: { children: ReactNode }) => (
    <div className="pb-12 sm:pb-0">{children}</div>
  );
  if (instagramId) {
    return (
      <Container>
        <a
          href={`https://www.instagram.com/p/${instagramId}`}
          target="_blank"
          className="uncooked-link"
        >
          {children}
        </a>
      </Container>
    );
  }
  return (
    <Container>
      <Link to={to} className="uncooked-link">
        {children}
      </Link>
    </Container>
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
    case "view-master-reel":
      return "View-Master Reel";
  }
  return "";
}
