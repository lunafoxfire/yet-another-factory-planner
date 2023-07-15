import Parse from "parse/node";
import Joi from "joi";
import { nanoid } from "nanoid";
import DB from "@/db";
import { ALLOWED_GAME_VERSIONS } from "@/game-data";

export const factoryConfigSchema = Joi.object({
  gameVersion: Joi.string().allow(...ALLOWED_GAME_VERSIONS).only().required(),
  productionItems: Joi.array().items(Joi.object({
    itemKey: Joi.string().required(),
    mode: Joi.string().required(),
    value: Joi.number().strict().required(),
  })).required(),
  inputItems: Joi.array().items(Joi.object({
    itemKey: Joi.string().required(),
    value: Joi.number().strict().required(),
    weight: Joi.number().strict().required(),
    unlimited: Joi.boolean().required(),
  })).required(),
  inputResources: Joi.array().items(Joi.object({
    itemKey: Joi.string().required(),
    value: Joi.number().strict().required(),
    weight: Joi.number().strict().required(),
    unlimited: Joi.boolean().required(),
  })).required(),
  allowHandGatheredItems: Joi.boolean().required(),
  weightingOptions: Joi.object({
    resources: Joi.number().strict().required(),
    power: Joi.number().strict().required(),
    complexity: Joi.number().strict().required(),
    buildings: Joi.number().strict().required(),
  }).required(),
  allowedRecipes: Joi.array().items(Joi.string()).required(),
});

export type SharedFactoryAttributes = {
  key?: string;
  factoryConfig?: Record<string, any>;
};

export default class SharedFactory extends Parse.Object<SharedFactoryAttributes> {
  public static TABLE_NAME = "SharedFactories";

  public static Object(attributes?: SharedFactoryAttributes) {
    return DB.Object<SharedFactoryAttributes>(SharedFactory.TABLE_NAME, attributes);
  }

  public static Query() {
    return DB.Query<SharedFactory>(SharedFactory.TABLE_NAME);
  }

  public static ExtractAttributes(obj: SharedFactory): SharedFactoryAttributes & { id: string } {
    return {
      id: obj.id,
      key: obj.get("key"),
      factoryConfig: obj.get("factoryConfig"),
    };
  }

  public static async getByKey(key: string): Promise<SharedFactoryAttributes | undefined> {
    const query = new Parse.Query(SharedFactory.TABLE_NAME);
    const factory = await query
      .equalTo("key", key)
      .first({ useMasterKey: true });
    return factory ? SharedFactory.ExtractAttributes(factory) : undefined;
  }

  public static async create(config: any): Promise<SharedFactoryAttributes> {
    const validation = factoryConfigSchema.validate(config);
    if (validation.error) throw validation.error;

    const key = nanoid();
    const factory = SharedFactory.Object({
      key,
      factoryConfig: config,
    });
    await factory.save(null, { useMasterKey: true });
    return SharedFactory.ExtractAttributes(factory);
  }
}
