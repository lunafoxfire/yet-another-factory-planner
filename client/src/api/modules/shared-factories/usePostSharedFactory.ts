import { post } from '../..';
import { useApi } from "../../useApi";
import { FactoryOptions } from '../../../contexts/production/types';

interface PostSharedFactoryRequest {
  gameVersion: string,
  factoryConfig: FactoryOptions,
}

interface PostSharedFactoryResponse {
  key: string,
}

export function usePostSharedFactory() {
  return useApi<PostSharedFactoryResponse, PostSharedFactoryRequest>(async (req) => {
    const body = {
      factoryConfig: {
        gameVersion: req.gameVersion,
        productionItems: req.factoryConfig.productionItems.map((i) => ({
          itemKey: i.itemKey,
          mode: i.mode,
          value: Number(i.value),
        })),
        inputItems: req.factoryConfig.inputItems.map((i) => ({
          itemKey: i.itemKey,
          value: Number(i.value),
          weight: Number(i.weight),
          unlimited: i.unlimited,
          
        })),
        inputResources: req.factoryConfig.inputResources.map((i) => ({
          itemKey: i.itemKey,
          value: Number(i.value),
          weight: Number(i.weight),
          unlimited: i.unlimited,
        })),
        allowHandGatheredItems: req.factoryConfig.allowHandGatheredItems,
        weightingOptions: {
          resources: Number(req.factoryConfig.weightingOptions.resources),
          power: Number(req.factoryConfig.weightingOptions.power),
          complexity: Number(req.factoryConfig.weightingOptions.complexity),
          buildings: Number(req.factoryConfig.weightingOptions.buildings),
        },
        allowedRecipes: Object.keys(req.factoryConfig.allowedRecipes).filter((key) => req.factoryConfig.allowedRecipes[key]),
        nodePositions: req.factoryConfig.nodePositions
      }
    }
    const res = await post('/share-factory', body);
    const json = res.data;
    return json.data;
  });
}
