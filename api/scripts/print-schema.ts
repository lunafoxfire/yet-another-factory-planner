import path from "path";
import fs from "fs";
import type { Knex } from "knex";
import "@/config";
import DB from "@/db";

const OUTPUT_FILE = path.join(__dirname, "..", "db/schema.json");

const EXCLUDE = [
  "knex_migrations",
  "knex_migrations_lock",
];

DB.init()
  .then(async () => {
    const result = await DB.knex.raw("SELECT tablename FROM pg_tables WHERE schemaname='public';");
    const schema: any = {};
    const promises: Knex.Raw<any>[] = [];
    result.rows.forEach(({ tablename }: any) => {
      if (EXCLUDE.includes(tablename)) return;
      const promise = DB.knex.raw(`SELECT * FROM ${tablename} WHERE false;`);
      promises.push(promise);
      promise.then(({ fields }) => {
        schema[tablename] = fields.map((field: any) => field.name);
      });
    });
    await Promise.all(promises);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schema, null, 2));
    // eslint-disable-next-line no-console
    console.log(`Schema written to ${OUTPUT_FILE}`);
    process.exit(0);
  });
