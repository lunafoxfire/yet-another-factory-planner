import { get } from '../..';
import { useApi } from "../../useApi";

interface GetSharedFactoryRequest {
  factoryKey: string,
}

interface GetSharedFactoryResponse {
  config: any,
}

export function useGetSharedFactory() {
  const { data, loading, error, request } = useApi<GetSharedFactoryResponse, GetSharedFactoryRequest>(async (req) => {
    const res = await get('/shared-factories/:factoryKey', req);
    const json = res.data;
    return json.data;
  });

  return { data, loading, error, request };
}
