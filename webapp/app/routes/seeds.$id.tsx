import { Layout } from "../components/Layout";

export default function SeedNotDiscovered() {
  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto mt-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-lg">
            <b>Seed undiscovered.</b> <span>Keep exploring!</span>
          </h1>
          <p>
            If you've found it, reach out to us at{" "}
            <a className="link" href="mailto:human@nopal.build">
              human@nopal.build
            </a>{" "}
            or on{" "}
            <a
              className="link"
              href="https://discord.gg/avFGzMNAXu"
              target="_blank"
            >
              discord
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
}
