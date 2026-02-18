import { Link } from "@remix-run/react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "Construction Tools | Nopal" },
  {
    name: "description",
    content: "Construction tools and calculators for the job site",
  },
];

interface Tool {
  name: string;
  description: string;
  href: string;
}

const TOOLS: Tool[] = [
  {
    name: "Volume Calculator by Frames",
    description:
      "Calculate backfill volumes along a linear run using cross-section frames. Supports multiple materials with weight estimation.",
    href: "/tools/frames-volume-calc",
  },
];

export default function ToolsIndex() {
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h1 className="text-4xl font-bold mt-8">Construction Tools</h1>
          <p className="purple-light-text text-xl mt-2">
            Calculators and utilities for the job site
          </p>

          <div className="mt-8 space-y-4">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                to={tool.href}
                prefetch="intent"
                className="block border border-gray-300 dark:border-[var(--dark-midground)] rounded-lg p-6 hover:border-[var(--green)] dark:hover:border-[var(--green)] transition-colors"
              >
                <h2 className="text-2xl font-semibold green-text">
                  {tool.name}
                </h2>
                <p className="mt-2 opacity-80">{tool.description}</p>
              </Link>
            ))}
          </div>

          <p className="mt-12 text-sm opacity-70">
            More tools coming soon. Have a suggestion?{" "}
            <a href="mailto:human@nopal.build" className="underline">
              Let us know
            </a>
            .
          </p>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
