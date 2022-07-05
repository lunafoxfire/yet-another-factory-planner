import App from 'app';
import Joi from 'joi';
import { createValidator } from 'express-joi-validation';
import { factoryConfigSchema } from 'models/SharedFactory';
import handlers from './handlers';

const validator = createValidator({ passError: true });

export function registerRoutes() {
  App.server.get(
    '/ping',
    handlers.ping,
  );

  App.server.get(
    '/shared-factories/:factoryKey',
    validator.params(Joi.object({
      factoryKey: Joi.string().required(),
    })),
    handlers.getSharedFactory,
  );

  App.server.post(
    '/share-factory',
    validator.body(Joi.object({
      factoryConfig: factoryConfigSchema.required(),
    }).required()),
    handlers.postSharedFactory,
  );
}
