// app/routes/fruits_.good-building-system.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, Link } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { AppLayout } from "../components/AppLayout";
import {
  getBuildingSystems,
  getCategories,
  type BsCategory,
  type BuildingSystem,
} from "../data/buildingSystem.server";
import { useMarkdown } from "../hooks/useMarkdown";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const [categoriesResult, buildingSystemsResult] = await Promise.all([
    getCategories(),
    getBuildingSystems(),
  ]);

  const categories = categoriesResult?.data ?? [];
  const buildingSystems = buildingSystemsResult?.data ?? [];

  return { user, categories, buildingSystems };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MarkdownBlock({ md }: { md: string }) {
  return (
    <div className="text-sm" style={{ color: "var(--text-subtle)" }}>
      {useMarkdown(md)}
    </div>
  );
}

function BuildingSystemCard({ bs }: { bs: BuildingSystem }) {
  return (
    <Link
      to={`/fruits/good-building-system/${bs._id}`}
      className="block hover:opacity-80 transition-opacity"
    >
      <div className="good-box p-5">
        <h3 className="font-bold text-sm mb-3">{bs.name}</h3>
        {bs.blocks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {bs.blocks.map((block, i) => {
              if (block.type === "markdown") {
                return <MarkdownBlock key={i} md={block.md} />;
              }
              return null;
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
            No content yet.
          </p>
        )}
      </div>
    </Link>
  );
}

function CategorySection({
  category,
  systems,
}: {
  category: BsCategory;
  systems: BuildingSystem[];
}) {
  return (
    <div className="mb-10">
      <h2 className="font-bold text-lg mb-4">{category.name}</h2>
      {systems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {systems.map((bs) => (
            <BuildingSystemCard key={bs._id} bs={bs} />
          ))}
        </div>
      ) : (
        <div
          className="good-box p-5 text-sm"
          style={{ color: "var(--text-subtle)" }}
        >
          No building systems in this category yet.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GoodBuildingSystem() {
  const { user, categories, buildingSystems } = useLoaderData<typeof loader>();
  const isAdmin = user.role === "Admin" || user.role === "Super";

  // Group building systems by categoryId
  const systemsByCategory = categories.map((cat) => ({
    category: cat,
    systems: buildingSystems.filter((bs) => bs.categoryId === cat._id),
  }));

  // Building systems that don't belong to any known category
  const knownCategoryIds = new Set(categories.map((c) => c._id));
  const uncategorized = buildingSystems.filter(
    (bs) => !knownCategoryIds.has(bs.categoryId)
  );

  const isEmpty = buildingSystems.length === 0;

  return (
    <AppLayout>
      <div
        className="container mx-auto px-4 py-12"
        style={{ maxWidth: "720px" }}
      >
        {/* Back */}
        <div className="mb-8">
          <Link
            to="/fruits"
            className="text-sm font-mono"
            style={{ color: "var(--purple-light)" }}
          >
            ← back to dashboard
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-10 flex items-center justify-between">
          <h1 className="font-bold text-2xl mb-2">Good Building</h1>
          {isAdmin && (
            <Link
              to="/fruits/good-building-system/new"
              className="text-sm font-mono"
              style={{ color: "var(--purple-light)" }}
            >
              + new component
            </Link>
          )}
        </div>

        {isEmpty ? (
          <div
            className="good-box p-6 text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            No building systems have been added yet.
          </div>
        ) : (
          <>
            {/* Categorized systems */}
            {systemsByCategory.map(({ category, systems }) => (
              <CategorySection
                key={category._id}
                category={category}
                systems={systems}
              />
            ))}

            {/* Uncategorized fallback */}
            {uncategorized.length > 0 && (
              <div className="mb-10">
                <h2 className="font-bold text-lg mb-4">Other</h2>
                <div className="flex flex-col gap-4">
                  {uncategorized.map((bs) => (
                    <BuildingSystemCard key={bs._id} bs={bs} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
