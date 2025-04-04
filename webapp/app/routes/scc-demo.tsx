import { Layout } from "../components/Layout";

export default function SCCDemo() {
  return (
    <Layout>
      <div className="simple-container">
        <h1 className="text-2xl mt-8">Scottsdale Community College</h1>
        <h2 className="text-4xl font-bold mt-2">Demo Wall</h2>
        <p className="mt-8 mb-8 text-lg">
          While Austin and Lucas were looking to take a leak, they came across
          this demo wall. It showed a classic example of building science gone
          wrong and we asked to fix it.
        </p>
        <img src="scc-demo/scc-demo-before.png" />
        <p className="mt-12 italic text-lg">More information coming soon.</p>
      </div>
    </Layout>
  );
}
