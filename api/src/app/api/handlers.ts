import type { RequestHandler } from "express";
import { getDataByVersion, LATEST_VERSION } from "@/game-data";
import SharedFactory from "@/models/SharedFactory";
import { APIError } from "@/util/errors";

const ping: RequestHandler = async (req, res) => {
  res.status(200).json({
    data: {
      message: "pong",
    },
  });
};

const initialize: RequestHandler = async (req, res) => {
  const { factoryKey, gameVersion } = req.query;
  let factory_config;

  if (factoryKey) {
    const factory = await SharedFactory.getByKey(factoryKey as string);
    if (!factory) {
      throw new APIError(400, "Invalid factory id");
    }
    factory_config = factory.factory_config;
  }

  const version = factory_config?.gameVersion || gameVersion || LATEST_VERSION;
  const game_data = getDataByVersion(version);

  res.status(200).json({
    data: {
      factory_config,
      game_data,
    },
  });
};

const getSharedFactory: RequestHandler = async (req, res) => {
  const { factoryKey } = req.params;
  const factory = await SharedFactory.getByKey(factoryKey);
  if (!factory) {
    throw new APIError(400, "Invalid factory id");
  }
  res.status(200).json({
    data: {
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
  initialize,
  getSharedFactory,
  postSharedFactory,
};
