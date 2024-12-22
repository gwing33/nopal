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
  database: "staging",
  // database: process.env.NODE_ENV == "production" ? "prod" : "staging",
  auth: {
    username: process.env.DATABASE_USERNAME || "",
    password: process.env.DATABASE_PASSWORD || "",
  },
};

export async function getDb(
  config: DbConfig = DEFAULT_CONFIG
): Promise<Surreal> {
  const db = new Surreal();

  try {
    await db.connect(config.url);
    await db.signin({
      namespace: config.namespace,
      database: config.database,
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
