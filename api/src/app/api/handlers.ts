import { RequestHandler } from 'express';
import SharedFactory from 'models/SharedFactory';

const ping: RequestHandler = async (req, res) => {
  res.status(200).json({
    data: {
      message: 'pong',
    },
  });
};

const getSharedFactory: RequestHandler = async (req, res) => {
  const { factoryKey } = req.params;
  const factory = await SharedFactory.getByKey(factoryKey);
  if (!factory) {
    res.status(400).json({
      message: 'Invalid factory id',
    });
    return;
  }
  res.status(200).json({
    data: {
      id: factory.id,
      key: factory.key,
      factory_config: factory.factory_config,
    },
  });
};

const postSharedFactory: RequestHandler = async (req, res) => {
  const { factoryConfig } = req.body;
  const factory = await SharedFactory.create(factoryConfig);
  if (!factory) {
    res.status(500);
    return;
  }
  res.status(201).json({
    data: {
      key: factory.key,
    },
  });
};

export default {
  ping,
  getSharedFactory,
  postSharedFactory,
};
