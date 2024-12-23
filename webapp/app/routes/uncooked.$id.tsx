import { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { getUncookedById } from "../data/uncooked.server";
import { readPost } from "../util/readpost.server";
import { NavLink, useLoaderData } from "@remix-run/react";
import { formatDate } from "../util/formatDate";
import { useMarkdown } from "../hooks/useMarkdown";

import homeStyles from "../styles/home.css?url";
import projectStyles from "../styles/project.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: homeStyles },
  { rel: "stylesheet", href: projectStyles },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  if (id) {
    const uncooked = await getUncookedById(id);
    if (uncooked?.type == "newspaper-clipping") {
      const body = await readPost(id + ".md");
      return { uncooked, body };
    }
  }
  throw new Response("Not Found", { status: 404 });
};

export default function UncookedItem() {
  const { uncooked, body } = useLoaderData<typeof loader>();
  const bodyHtml = useMarkdown(body);
  return (
    <Layout>
      <div className="pr-4 pl-4 scene1">
        <div className="simple-container mt-8">
          <div className="mb-6">
            <h1 className="font-bold">{uncooked.title}</h1>
            <div>
              by: {uncooked.author}, {formatDate(new Date(uncooked.date))}
            </div>
          </div>
          {bodyHtml}
          <div className="mt-10">
            <NavLink to="/uncooked" className="link">
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
