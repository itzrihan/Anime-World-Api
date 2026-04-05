import axios from "axios";
import { HEADERS } from "../config/index.js";
import * as http from "http";
import * as https from "https";

// Keep-alive agents reuse TCP connections — big win when making many requests to the same host
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 20 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

export const httpClient = axios.create({
  timeout: 10000,
  headers: HEADERS,
  httpAgent,
  httpsAgent,
});

export async function fetchPage(url: string): Promise<string> {
  const response = await httpClient.get<string>(url, { responseType: "text" });
  return response.data;
}
