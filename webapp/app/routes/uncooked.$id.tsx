import { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { Layout, ContactUsLinks, Footer } from "../components/layout";
import { getUncookedIngredients } from "../data/uncooked";
import { readPost } from "../util/readpost.server";
import { useLoaderData } from "@remix-run/react";
import showdown from "showdown";
import { useMemo } from "react";

import uncookedStyles from "../styles/uncooked.css?url";

export const links: LinksFunction = () => [
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
  const bodyHtml = useMemo(() => {
    const converter = new showdown.Converter();
    return converter.makeHtml(body);
  }, [body]);
  return (
    <Layout>
      <div className="pr-4 pl-4">
        <div className="container mx-auto max-w-screen-sm font-mono uncooked-markdown mt-8">
          <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      </div>
    </Layout>
  );
}
