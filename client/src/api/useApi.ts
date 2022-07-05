import { useState } from "react";
import { APIRequestData, APIResponseData, APIError, APIAction } from "./types";

export function useApi<RES extends APIResponseData = APIResponseData, REQ extends APIRequestData = APIRequestData>(apiAction: APIAction<RES, REQ>) {
  const [data, setData] = useState<RES | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function requestHandler(req: REQ) {
    setLoading(true);
    try {
      const result = await apiAction(req);
      setData(result);
      setError(null);
    } catch (e: any) {
      const apiError: APIError = {
        status: e.status || 0,
        message: e.message || 'Unknown error',
      }
      setData(null);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }

  return {
    data,
    error,
    loading,
    request: requestHandler,
  };
};
