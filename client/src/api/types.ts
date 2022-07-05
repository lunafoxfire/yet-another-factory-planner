export interface PlainObject {
  [key: string]: any,
}

export type APIRequestData = PlainObject | undefined;

export type APIResponseData = PlainObject | null;

export interface APIError {
  status: number,
  message: string,
}

export type APIAction<RES extends APIResponseData = APIResponseData, REQ extends APIRequestData = APIRequestData> = (req: REQ) => Promise<RES>;
