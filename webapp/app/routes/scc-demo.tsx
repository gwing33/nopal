import { Layout } from "../components/Layout";

export default function SCCDemo() {
  return (
    <Layout>
      <div className="simple-container">
        <h1 className="text-4xl font-bold mt-8">Demo Wall</h1>
        <h2 className="purple-light-text text-xl">
          Scottsdale Community College
        </h2>
        <p className="mt-8 mb-8 text-lg">
          While Austin and Lucas were looking to take a leak, they came across
          this demo wall. It showed a classic example of building science gone
          wrong and we asked to fix it.
        </p>
        <img src="/scc-demo/scc-demo-before.png" />

        <h3 className="red-text text-3xl mt-8">Paper Faced Fiberglass Batts</h3>
        <p className="mb-4 text-lg">
          The craft faced paper on fiberglass was inteded to be an air and vapor
          control barrier.
        </p>
        <p className="mb-4 text-lg">
          Installing these batts are challenging to place correctly, but even
          then the material itself became a condensation point that lead to rot
          and mold.
        </p>

        <h4 className="red-text text-xl font-bold mt-4">
          Fiberglass Performance
        </h4>
        <p className="mb-4 text-lg">TODO</p>

        <p className="mt-12 italic text-lg">More information coming soon.</p>
      </div>
    </Layout>
  );
}
