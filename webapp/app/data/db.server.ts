import Surreal from "surrealdb";

interface DbConfig {
  url: string;
  namespace: string;
  database: string;
  auth: {
    username: string;
    password: string;
  };
}

const DEFAULT_CONFIG: DbConfig = {
  url: process.env.DATABASE_URL || "http://localhost:8080/rpc",
  namespace: "nopal",
  database: "opuntia",
  auth: {
    username: process.env.SURREAL_USER || "",
    password: process.env.SURREAL_PASS || "",
  },
};

export async function getDb(
  config: DbConfig = DEFAULT_CONFIG
): Promise<Surreal> {
  const db = new Surreal();

  try {
    await db.connect(config.url, { versionCheck: false });
    await db.signin({
      ...config.auth,
    });

    await db.use({ namespace: config.namespace, database: config.database });
    return db;
  } catch (err) {
    console.error(
      "Failed to connect to SurrealDB:",
      err instanceof Error ? err.message : String(err)
    );
    await db.close();
    throw err;
  }
}
