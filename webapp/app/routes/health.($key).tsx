import type { Collection } from "../data/generic.server";
import type { IngredientRecord } from "../data/notion/types";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { GbScore } from "../components/GbScore";
import { NotionText } from "../components/NotionText";
import { GoodArrow } from "../components/GoodAssets";
import { isPublished, isFavorite } from "../data/ingredients";
import { getCacheControlHeader } from "../util/getCacheControlHeader.server";
import { getAllIngredients } from "../data/notion/ingredients.server";
import { getAllRecipes } from "../data/notion/recipes.server";

export function headers() {
  return {
    "Cache-Control": getCacheControlHeader(),
  };
}

type LoaderResult = {
  data: Collection<IngredientRecord>;
};
export const loader = async (remixContext: LoaderFunctionArgs) => {
  const key = remixContext.params?.key || "recipes";

  switch (key) {
    case "ingredients":
      const ingredients = await getAllIngredients();
      return { data: ingredients };
    case "recipes":
      const recipes = await getAllRecipes();
      return { data: recipes };
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
        if (location.pathname === "/health/collections") {
          return null;
        }
        if (location.pathname === "/health/ingredients") {
          return <HealthItem item={i} type="ingredients" key={i._id} />;
        }
        return <HealthItem item={i} type="recipes" key={i._id} />;
      })}
    </>
  );
}

function HealthItem({
  item,
  type,
}: {
  item: any;
  type: "recipes" | "ingredients";
}) {
  const navigation = useNavigate();
  const location = useLocation();
  const search = location?.search || "";
  const { name, slug, summary, gbs, svg } = item;

  return (
    <div
      onClick={() => {
        navigation(`/${type}/${slug}`);
      }}
      className="good-box good-box-hover p-4 flex flex-col justify-between"
    >
      <div>
        <div className="mt-8 gap-2 flex justify-center items-end">
          <img src={svg} />
          <GbScore score={gbs} favorite={isFavorite(item)} />
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
