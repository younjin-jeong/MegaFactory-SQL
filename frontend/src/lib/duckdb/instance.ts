import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    const instance = new duckdb.AsyncDuckDB(logger, worker);
    await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);

    db = instance;
    return instance;
  })();

  return initPromise;
}

export async function getDuckDBConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  const database = await getDuckDB();
  return database.connect();
}

export async function closeDuckDB(): Promise<void> {
  if (db) {
    await db.terminate();
    db = null;
    initPromise = null;
  }
}
