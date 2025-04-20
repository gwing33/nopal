import {
  getAllIngredients,
  getAllRecipes,
  getAllCollections,
} from "../data/notion.server";
import type { Collection } from "../data/generic.server";
import type { IngredientRecord } from "../data/notion.server";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { GbScore } from "../components/GbScore";
import { NotionText } from "../components/NotionText";
import { GoodArrow } from "../components/GoodAssets";
import { isPublished, isFavorite } from "../data/ingredients";
import { getCacheControlHeader } from "../util/getCacheControlHeader.server";

export function headers() {
  return {
    "Cache-Control": getCacheControlHeader(),
  };
}

type LoaderResult = {
  data: Collection<IngredientRecord>;
};
export const loader = async (remixContext: LoaderFunctionArgs) => {
  const key = remixContext.params?.key || "ingredients";

  switch (key) {
    case "ingredients":
      const ingredients = await getAllIngredients();
      return { data: ingredients };
    // case "recipes":
    //   const recipes = await getAllRecipes();
    //   return { data: recipes };
    // case "collections":
    //   const collections = await getAllCollections();
    //   return { data: collections };
  }
};

export default function HealthIndex() {
  const location = useLocation();
  const { data } = useLoaderData<LoaderResult>();

  return (
    <>
      {data.data.map((i) => {
        const status = isPublished(i);
        if (!status) {
          return null;
        }
        if (
          location.pathname === "/health/collections" ||
          location.pathname === "/health/recipes"
        ) {
          return null;
        }
        return <Ingredient ingredient={i} key={i._id} />;
      })}
    </>
  );
}

function Ingredient({ ingredient }: { ingredient: any }) {
  const navigation = useNavigate();
  const location = useLocation();
  const search = location?.search || "";
  const { name, slug, summary, gbs } = ingredient;

  return (
    <div
      onClick={() => {
        navigation("/ingredients/" + slug + search);
      }}
      className="good-box good-box-hover p-4 flex flex-col justify-between"
    >
      <div>
        <div className="mt-8 flex justify-center items-end">
          <GbScore score={gbs} favorite={isFavorite(ingredient)} />
        </div>
        <h3 className="mt-2 text-center font-bold purple-light-text text-2xl">
          {name}
        </h3>
        <div className="mt-2 text-center">
          <NotionText text={summary?.rich_text} />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <GoodArrow />
      </div>
    </div>
  );
}
