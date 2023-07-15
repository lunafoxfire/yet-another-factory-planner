import Parse from "parse/node";
import { createLogger } from "@/util/logger";

const logger = createLogger("db");

export default class DB {
  public static initialized = false;

  public static async init() {
    logger.info("Connecting to database...");
    Parse.initialize(process.env.PARSE_APP_ID!);
    Parse.masterKey = process.env.PARSE_MASTER_KEY!;
    Parse.serverURL = process.env.PARSE_SERVER_URL!;
    this.initialized = true;
    logger.info("Database ready!");
  }

  public static Object<T extends Parse.Attributes>(className: string, attributes?: T): Parse.Object<T> {
    return new Parse.Object(className, attributes) as Parse.Object<T>;
  }

  public static Query<T extends Parse.Object<Parse.Attributes>>(className: string): Parse.Query<T> {
    return new Parse.Query(className);
  }
}
