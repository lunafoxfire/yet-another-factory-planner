import { get } from '../..';
import { useApi } from "../../useApi";
import { GameData } from '../../../contexts/gameData/types';

interface GetSharedFactoryRequest {
  factoryKey?: string,
  gameVersion?: string,
}

interface GetSharedFactoryResponse {
  factory_config?: any,
  game_data: GameData,
}

export function useGetInitialize() {
  return useApi<GetSharedFactoryResponse, GetSharedFactoryRequest>(async (req) => {
    const res = await get('/initialize', req);
    const json = res.data;
    return json.data;
  });
}
