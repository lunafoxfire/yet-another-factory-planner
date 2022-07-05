import axios from "axios";
import { PlainObject } from "./types";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  responseType: 'json',
});

const urlParamsRegex = /:([a-zA-Z0-9-_]+)/g;
function parseURL(url: string, data: PlainObject) {
  const parsedData = { ...data };
  const parsedURL = url.replace(urlParamsRegex, (match, key) => {
    const value = data[key];
    if (typeof value === 'string') {
      delete parsedData[key];
      return value;
    }
    if (typeof value === 'number') {
      delete parsedData[key];
      return String(value);
    }
    if (value === undefined) {
      console.error(`Error while parsing url ${url}. No value provided for required parameter ${match}.`);
    } else {
      console.error(`Error while parsing url ${url}. Datatype provided for parameter ${match} cannot be serialized.`);
    }
    return match;
  });

  return { parsedURL, parsedData };
}

export async function get(url: string, data?: PlainObject) {
  const { parsedURL, parsedData } = parseURL(url, data || {});
  return apiClient.request({
    method: 'GET',
    url: parsedURL,
    params: parsedData,
  });
}

export async function post(url: string, data?: PlainObject) {
  const { parsedURL, parsedData } = parseURL(url, data || {});
  return apiClient.request({
    method: 'POST',
    url: parsedURL,
    data: parsedData,
  });
}

export default apiClient;
