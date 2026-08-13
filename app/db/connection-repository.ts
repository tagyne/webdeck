import { db, type WebdeckDatabase } from "./database";
import type { ObsConnectionSettings } from "../features/obs/types";

export type ConnectionRepository = {
  get: () => Promise<ObsConnectionSettings | undefined>;
  save: (connection: ObsConnectionSettings) => Promise<void>;
};

export function createConnectionRepository(
  database: WebdeckDatabase = db,
): ConnectionRepository {
  return {
    async get() {
      const record = await database.connectionSettings.get("primary");
      if (!record) {
        return undefined;
      }

      return {
        host: record.host,
        port: record.port,
        ...(record.password ? { password: record.password } : {}),
      };
    },
    async save(connection) {
      await database.connectionSettings.put({
        id: "primary",
        ...connection,
      });
    },
  };
}
