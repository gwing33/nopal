import { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { Layout, Footer } from "../components/layout";
import { getUncookedIngredients } from "../data/uncooked";
import { readPost } from "../util/readpost.server";
import { NavLink, useLoaderData } from "@remix-run/react";
import { formatDate } from "../util/date";
import { useMarkdown } from "../hooks/useMarkdown";

import homeStyles from "../styles/home.css?url";
import uncookedStyles from "../styles/uncooked.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: uncookedStyles },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  if (id) {
    const ingrediant = getUncookedIngredients().ingredients.find(
      (ing) => ing.id === id
    );
    if (ingrediant?.type == "newspaper-clipping") {
      const body = await readPost(ingrediant.id + ".md");
      return { ingrediant, body };
    }
  }
  throw new Response("Not Found", { status: 404 });
};

export default function UncookedItem() {
  const { ingrediant, body } = useLoaderData<typeof loader>();
  const bodyHtml = useMarkdown(body);
  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="uncooked-container mt-8">
          <div className="mb-6">
            <h1 className="font-bold">{ingrediant.title}</h1>
            <div>
              by: {ingrediant.author}, {formatDate(new Date(ingrediant.date))}
            </div>
          </div>
          {bodyHtml}
          <div className="mt-10">
            <NavLink to="/uncooked" className="uncooked-link">
              &larr; Back to Uncooked
            </NavLink>
          </div>
        </div>
      </div>
      <Footer title="Want to learn more?">
        Let us know what you think about this article.
      </Footer>
    </Layout>
  );
}
