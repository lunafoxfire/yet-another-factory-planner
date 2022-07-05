import { get } from '../..';
import { useApi } from "../../useApi";

interface GetSharedFactoryRequest {
  factoryKey: string,
}

interface GetSharedFactoryResponse {
  id: number,
  key: string,
  factory_config: any,
}

export function useGetSharedFactory() {
  return useApi<GetSharedFactoryResponse, GetSharedFactoryRequest>(async (req) => {
    const res = await get('/shared-factories/:factoryKey', req);
    const json = res.data;
    return json.data;
  });
}
