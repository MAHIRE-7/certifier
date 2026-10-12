/**
 * Cloudflare D1 Database Client interface & mock adapter using Node's native node:sqlite.
 */
export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: Record<string, unknown> }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
  exec?(query: string): Promise<unknown>;
}

/**
 * Creates an in-memory or file-backed SQLite adapter using Node's native DatabaseSync (node:sqlite)
 * for seamless local dev & automated testing without external dependencies.
 */
export function createLocalSqliteDb(sqliteDb: any): D1DatabaseLike {
  return {
    prepare(query: string): D1PreparedStatement {
      let boundParams: unknown[] = [];
      const stmt = sqliteDb.prepare(query);

      const prep: D1PreparedStatement = {
        bind(...params: unknown[]) {
          boundParams = params.map((p) => (p === undefined ? null : p));
          return prep;
        },
        async all<T = Record<string, unknown>>() {
          const results = stmt.all(...boundParams) as T[];
          return { results };
        },
        async first<T = Record<string, unknown>>() {
          const result = stmt.get(...boundParams);
          return (result ?? null) as T | null;
        },
        async run() {
          const info = stmt.run(...boundParams);
          return {
            success: true,
            meta: {
              changes: info.changes,
              last_row_id: Number(info.lastInsertRowid)
            }
          };
        }
      };

      return prep;
    },
    async batch(statements: D1PreparedStatement[]) {
      const results: unknown[] = [];
      for (const s of statements) {
        results.push(await s.run());
      }
      return results;
    },
    async exec(query: string) {
      sqliteDb.exec(query);
    }
  };
}
