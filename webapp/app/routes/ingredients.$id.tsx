import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getIngredientBySlug } from "../data/notion.server";
import { GbScore } from "../components/GbScore";
import { isFavorite } from "../data/ingredients";
import { LinksFunction } from "@remix-run/node";
import { Breadcrumb } from "../components/Breadcrumb";
import healthStyles from "../styles/health.css?url";
import {
  HealthFactor,
  EfficiencyFactor,
  LongevityFactor,
  CarbonFactor,
  SocialEquityFactor,
} from "../components/FiveFactors";
import { NotionText } from "../components/NotionText";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: healthStyles },
];

type Ingredient = Awaited<ReturnType<typeof getIngredientBySlug>>;

export async function loader(context: LoaderFunctionArgs) {
  const id = context.params?.id;
  if (!id) {
    return redirect("/health");
  }
  const ingredient = await getIngredientBySlug(id);
  return { ingredient };
}

export default function IngredientsId() {
  const { ingredient } = useLoaderData<Ingredient>();
  const { properties } = ingredient;
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container">
          <div className="mt-12">
            <Breadcrumb>
              <Link to="/health">All Ingredients</Link>
            </Breadcrumb>
          </div>
          <div className="flex items-center mb-8">
            <h1 className="mr-4 purple-light-text text-4xl">
              {properties.Name.title[0].plain_text}{" "}
            </h1>
            <GbScore
              score={properties.GBS.number}
              favorite={isFavorite(ingredient)}
            />
          </div>
          <NotionText text={properties["Overview Description"].rich_text} />
          {/* <p className="mt-8 text-xl">
            {properties["Overview Description"].rich_text[0].plain_text}
          </p> */}

          <h2 className="green-text text-3xl mt-12">Scoring</h2>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <HealthFactor score={properties["Comfort Score"].number} />
              <NotionText text={properties["Comfort Description"].rich_text} />
            </div>
            <div>
              <EfficiencyFactor score={properties["Efficiency Score"].number} />
              <NotionText
                text={properties["Efficiency Description"].rich_text}
              />
            </div>
            <div>
              <LongevityFactor score={properties["Longevity Score"].number} />
              <NotionText
                text={properties["Longevity Description"].rich_text}
              />
            </div>
            <div>
              <SocialEquityFactor
                score={properties["Social Impact Score"].number}
              />
              <NotionText
                text={properties["Social Impact Description"].rich_text}
              />
            </div>
            <div>
              <CarbonFactor score={properties["Carbon Score"].number} />
              <NotionText text={properties["Carbon Description"].rich_text} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
