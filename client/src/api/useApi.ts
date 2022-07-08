import { useCallback, useMemo, useState } from "react";
import { usePrevious } from "../hooks/usePrevious";
import { APIRequestData, APIResponseData, APIError, APIAction } from "./types";

export function useApi<RES extends APIResponseData = APIResponseData, REQ extends APIRequestData = APIRequestData>(apiAction: APIAction<RES, REQ>) {
  const [data, setData] = useState<RES | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const prevLoading = usePrevious(loading);

  const requestHandler = useCallback(async (req: REQ) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo(() => ({
    data,
    error,
    loading,
    completedThisFrame: !loading && !!prevLoading,
    request: requestHandler,
  }), [data, error, loading, prevLoading, requestHandler]);

  return api;
};
