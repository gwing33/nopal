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
import { NotionPageDetails } from "../components/NotionPageDetails";

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

  const {
    name,
    gbs,
    comfortScore,
    efficiencyScore,
    longevityScore,
    socialImpactScore,
    carbonScore,
    pageDetails,
  } = ingredient;
  // console.log(pageDetails);
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container">
          <div className="mt-12">
            <Breadcrumb>
              <Link to="/health">All Ingredients</Link>
            </Breadcrumb>
          </div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="mr-4 purple-light-text text-4xl">{name} </h1>
            <GbScore score={gbs} favorite={isFavorite(ingredient)} />
          </div>

          <NotionPageDetails pageDetails={pageDetails} />

          <h2 className="green-text text-3xl mt-12">Scoring</h2>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <HealthFactor score={comfortScore} />
            </div>
            <div>
              <EfficiencyFactor score={efficiencyScore} />
            </div>
            <div>
              <LongevityFactor score={longevityScore} />
            </div>
            <div>
              <SocialEquityFactor score={socialImpactScore} />
            </div>
            <div>
              <CarbonFactor score={carbonScore} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
