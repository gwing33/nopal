import { LinksFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import uncookedLightImg from "../images/uncooked/uncooked-light.svg";
import uncookedDarkImg from "../images/uncooked/uncooked-dark.svg";
import { getAllUncooked } from "../data/uncooked.server";
import { useSchemePref } from "../hooks/useSchemePref";
import { useState, useCallback, SyntheticEvent } from "react";
import { Print } from "../components/Print";
import { ViewMasterReel } from "../components/ViewMasterReel";
import { NewspaperClipping } from "../components/NewspaperClipping";

import homeStyles from "../styles/home.css?url";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
];

export const loader = async () => {
  return getAllUncooked();
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
  const showLoadMore = data?.data.length > limit;

  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container pb-10">
          <img
            src={isDark ? uncookedDarkImg : uncookedLightImg}
            alt="uncooked"
            className="md:-ml-20 pb-16"
          />
          {(data?.data || []).map((i, idx) => {
            if (idx < limit) {
              switch (i.type) {
                case "newspaper-clipping":
                  return <NewspaperClipping key={i.id.id} clipping={i} />;
                case "print":
                case "presentation":
                  return <Print key={i.id.id} print={i} />;
                case "view-master-reel":
                  return <ViewMasterReel key={i.id.id} reel={i} />;
              }
            }
            return null;
          })}
          {showLoadMore ? (
            <>
              <del
                className="mr-4"
                style={{ color: isDark ? "var(--red-light)" : "var(--red)" }}
              >
                Load more
              </del>
              <button
                className="btn-secondary font-hand"
                onClick={handleLoadMore}
              >
                Learn more
              </button>
            </>
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
