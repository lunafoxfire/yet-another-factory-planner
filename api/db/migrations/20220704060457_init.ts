import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("shared_factories", (table) => {
    table.increments("id");
    table.string("key").notNullable().unique();
    table.jsonb("factory_config").defaultTo("{}");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("shared_factories");
}
