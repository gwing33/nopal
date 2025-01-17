import { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import uncookedLightImg from "../images/uncooked/uncooked-light.svg";
import uncookedDarkImg from "../images/uncooked/uncooked-dark.svg";
import { getAllUncooked, AllUncooked } from "../data/uncooked.server";
import { useSchemePref } from "../hooks/useSchemePref";
import { useState, useCallback, SyntheticEvent, useEffect } from "react";
import { Print } from "../components/Print";
import { ViewMasterReel } from "../components/ViewMasterReel";
import { NewspaperClipping } from "../components/NewspaperClipping";

import homeStyles from "../styles/home.css?url";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
];

const DISPLAY_LIMIT = 10;

export const loader = async (remixContext: LoaderFunctionArgs) => {
  const url = new URL(remixContext.request.url);
  const start = Number(url.searchParams.get("start")) || 0;
  return getAllUncooked({ limit: DISPLAY_LIMIT, start });
};

export default function Uncooked() {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  const data = useLoaderData<typeof loader>();
  const [nextStart, setNextStart] = useState<number | null>(
    data?.metadata?.nextStart || null
  );
  const [items, setItems] = useState(data?.data || []);
  const fetcher = useFetcher<AllUncooked>();

  useEffect(() => {
    if (!fetcher.data || fetcher.state === "loading") {
      return;
    }
    if (fetcher.data) {
      setNextStart(fetcher.data?.metadata.nextStart);
      const newItems = fetcher.data?.data;
      setItems((prevAssets) => [...prevAssets, ...newItems]);
    }
  }, [fetcher.data]);

  const handleLoadMore = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      fetcher.load(`?start=${nextStart}`);
    },
    [nextStart]
  );
  const showLoadMore = nextStart;

  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container pb-10">
          <img
            src={isDark ? uncookedDarkImg : uncookedLightImg}
            alt="uncooked"
            className="md:-ml-20 pb-16"
          />
          {items.map((i, idx) => {
            switch (i.type) {
              case "newspaper-clipping":
                return <NewspaperClipping key={i.id.id} clipping={i} />;
              case "print":
              case "presentation":
                return <Print key={i.id.id} print={i} />;
              case "view-master-reel":
                return <ViewMasterReel key={i.id.id} reel={i} />;
            }
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
