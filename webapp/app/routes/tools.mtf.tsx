import { useMemo } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Breadcrumb } from "../components/Breadcrumb";
import { VisualPreviewer } from "../features/ViewFinder/VisualPreviewer";
import { buildMTFPostGeometry } from "../features/ViewFinder/MTFGeo";
import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "MTF | Nopal Tools" },
  {
    name: "description",
    content: "Tool helping understand MTF",
  },
];

export default function MTFCalc() {
  const geo = useMemo(() => buildMTFPostGeometry(), []);

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <Breadcrumb>
            <Link to="/tools">All Tools</Link>
          </Breadcrumb>
          <h1 className="text-4xl font-bold mt-8">MTF</h1>

          <p className="mt-4 mb-8 text-lg">Calculate the MTF</p>

          {/* Post spec summary */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Studs</p>
              <p className="opacity-70">
                2× 2×6 @ 8&apos; (96&quot;) — 1.5&quot; × 5.5&quot; actual
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Tenon / Bridging block</p>
              <p className="opacity-70">
                2× 2×6 laminated — 3&quot; × 5.5&quot; cross-section
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Top Tenon</p>
              <p className="opacity-70">
                26.5&quot; vertical · inserts 8&quot; below stud top
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Upper Bridging</p>
              <p className="opacity-70">
                12&quot; vertical · centred between mid &amp; top tenons
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Mid Tenon</p>
              <p className="opacity-70">
                14.5&quot; horizontal · centred at 4&apos; (48&quot;)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Lower Bridging</p>
              <p className="opacity-70">
                12&quot; vertical · centred between sill &amp; mid tenons
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 sm:col-span-2">
              <p className="font-semibold mb-1">Sill Tenon</p>
              <p className="opacity-70">
                14.5&quot; horizontal · at base (0&quot;)
              </p>
            </div>
          </div>

          {/* 3-D preview */}
          <VisualPreviewer geometry={geo} />
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
