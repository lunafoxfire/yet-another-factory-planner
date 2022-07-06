import DB from 'db';
import Joi from 'joi';
import { nanoid } from 'nanoid';
import { ALLOWED_GAME_VERSIONS } from 'game-data';

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

interface SharedFactorySchema {
  id: number,
  key: string,
  factory_config: any,
}

export default class SharedFactory {
  public static TABLE_NAME = 'shared_factories';

  public static async getByKey(key: string): Promise<SharedFactorySchema> {
    const factory = await DB.knex(SharedFactory.TABLE_NAME)
      .where({ key })
      .select()
      .first('*');
    return factory;
  }

  public static async create(config: any): Promise<SharedFactorySchema> {
    const validation = factoryConfigSchema.validate(config);
    if (validation.error) throw validation.error;

    const key = nanoid();
    const [factory] = await DB.knex(SharedFactory.TABLE_NAME)
      .insert({ key, factory_config: JSON.stringify(config) })
      .returning('*');
    return factory;
  }
}
