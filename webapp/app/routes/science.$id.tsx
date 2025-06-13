import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getTastingBySlug } from "../data/notion/tastings.server";
import { LinksFunction } from "@remix-run/node";
import { Breadcrumb } from "../components/Breadcrumb";
import healthStyles from "../styles/health.css?url";
import { NotionPageDetails } from "../components/NotionPageDetails";
import { getCacheControlHeader } from "../util/getCacheControlHeader.server";
import { HealthItem } from "../routes/health.($key)";

export function headers() {
  return {
    "Cache-Control": getCacheControlHeader(),
  };
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: healthStyles },
];

type Tasting = Awaited<ReturnType<typeof getTastingBySlug>>;

export async function loader(context: LoaderFunctionArgs) {
  const id = context.params?.id;
  if (!id) {
    return redirect("/health");
  }
  const tasting = await getTastingBySlug(id);
  return { tasting };
}

export default function ScienceId() {
  const { tasting } = useLoaderData<{ tasting: Tasting }>();
  if (!tasting) {
    return null;
  }

  const { name, pageDetails } = tasting;

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <div className="mt-12">
            <Breadcrumb>
              <Link to={"/health"}>All Applied Sciences</Link>
            </Breadcrumb>
          </div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="mr-4 purple-light-text text-4xl">{name} </h1>
          </div>

          <NotionPageDetails pageDetails={pageDetails} />

          <h2 className="green-text text-4xl mt-12">
            Dive Into the Assemblies
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasting.recipes.map((recipe) => {
              return (
                <HealthItem key={recipe.id} type="recipes" item={recipe} />
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
