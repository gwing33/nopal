import { Layout } from "../components/Layout";
import { FooterDiscovery } from "../components/Footer";
import {
  getAllIngredients,
  getAllRecipes,
  getAllConnections,
} from "../data/notion.server";
import type { Collection } from "../data/generic.server";
import type { NotionObject } from "../data/notion.server";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import { GbScore } from "../components/GbScore";

type LoaderResult = {
  ingredients: Collection<NotionObject>;
  recipes: Collection<NotionObject>;
  connections: Collection<NotionObject>;
};
export const loader = async (/* remixContext: LoaderFunctionArgs */) => {
  const ingredients = await getAllIngredients();
  const recipes = await getAllRecipes();
  const connections = await getAllConnections();
  return { ingredients, recipes, connections };
  // const url = new URL(remixContext.request.url);
  // const start = Number(url.searchParams.get("start")) || 0;
  // return getAllUncooked({ limit: DISPLAY_LIMIT, start });
};

export function shouldRevalidate() {
  return false;
}

export default function Health() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = useLoaderData<LoaderResult>();
  const { ingredients, recipes, connections } = data;
  const isTutorial = location.search.includes("tutorial=true");
  // console.log(ingredients, recipes, connections);
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container">
          <h1 className="purple-light-text text-4xl mt-12">
            The Good Building Score
          </h1>
          <div className="flex gap-2 mt-8">
            <GbScore score={0} />
            <GbScore score={5} />
            <GbScore score={15} />
            <GbScore score={25} />
            <GbScore score={35} />
            <GbScore score={45} />
            <GbScore score={50} favorite={true} />
          </div>
          <div className="mt-2">
            <a
              className="link font-mono text-lg"
              onClick={(e) => {
                e.preventDefault();
                navigate(isTutorial ? "" : "?tutorial=true", { replace: true });
              }}
              href={isTutorial ? "" : "?tutorial=true"}
            >
              {isTutorial ? "Hide" : "Enable"} Tutorial
            </a>
          </div>

          <div className="folder-tabs mt-12">
            <a className="active">Ingredients</a>
            <a>Recipes</a>
            <a>Collections</a>
          </div>
        </div>
      </div>
      <FooterDiscovery />
    </Layout>
  );
}
