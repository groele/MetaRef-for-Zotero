import { requestGET } from "./http";
import { getPref } from "./prefs";
import { withThrottle } from "./throttle";

export interface EasyScholarRank {
  jcr?: string;
  impactFactor?: string;
  impactFactor5Year?: string;
  casUpgrade?: string;
  casBasic?: string;
  casSmall?: string;
  casTop?: string;
  casWarning?: string;
  sci?: string;
  ssci?: string;
  ei?: string;
  ahci?: string;
  jci?: string;
  esi?: string;
  ajg?: string;
  ccf?: string;
  fms?: string;
  utd24?: string;
  ft50?: string;
  cssci?: string;
  pku?: string;
  cscd?: string;
  technologyCore?: string;
}

export type EasyScholarResult
  = | { status: "success"; data: EasyScholarRank }
    | { status: "not-found" }
    | { status: "unconfigured" }
    | { status: "error"; message: string };

const cache = new Map<string, { expires: number; result: EasyScholarResult }>();
const CACHE_TTL = 6 * 60 * 60_000;
const MAX_CACHE_SIZE = 256;

function value(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = record[key] ?? record[key.replace(/\s+/g, "")];
    if (raw !== undefined && raw !== null && String(raw).trim())
      return String(raw).trim();
  }
}

function membership(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  const result = value(record, ...keys);
  if (!result)
    return undefined;
  return /^(?:否|no|false|0)$/i.test(result) ? "否" : "是";
}

export function parseEasyScholarRank(raw: unknown): EasyScholarRank {
  if (!raw || typeof raw !== "object")
    return {};
  const data = raw as Record<string, unknown>;
  return {
    jcr: value(data, "sci", "ssci", "JCR 分区", "jcr"),
    impactFactor: value(data, "sciif", "if", "影响因子"),
    impactFactor5Year: value(data, "sciif5", "if5", "5 年影响因子"),
    casUpgrade: value(data, "sciUp", "xr", "中科院分区升级版", "中科院升级版"),
    casBasic: value(data, "sciBase", "中科院基础版", "中科院分区基础版"),
    casSmall: value(data, "sciUpSmall", "xrSmall", "中科院升级版小类分区"),
    casTop: value(data, "sciUpTop", "xrTop", "中科院升级版 Top 分区", "中科院 Top"),
    casWarning: value(data, "sciwarn", "xrWarn", "中科院预警", "预警期刊"),
    sci: membership(data, "sci", "SCI"),
    ssci: membership(data, "ssci", "SSCI"),
    ei: membership(data, "eii", "ei", "EI"),
    ahci: value(data, "ahci", "AHCI"),
    jci: value(data, "jci", "JCI"),
    esi: value(data, "esi", "ESI"),
    ajg: value(data, "ajg", "AJG"),
    ccf: value(data, "ccf", "CCF"),
    fms: value(data, "fms", "FMS"),
    utd24: membership(data, "utd24", "UTD24"),
    ft50: membership(data, "ft50", "FT50"),
    cssci: value(data, "cssci", "CSSCI", "CSSCI/南大核心"),
    pku: value(data, "pku", "pkucore", "北大核心"),
    cscd: value(data, "cscd", "CSCD"),
    technologyCore: value(data, "zhongguokejihexin", "中国科技核心期刊", "科技核心"),
  };
}

const request = withThrottle(async (url: string, signal?: AbortSignal) => {
  const response = await requestGET(url, { timeout: 15_000 }, signal);
  const text = response.responseText || (typeof response.response === "string" ? response.response : "");
  return JSON.parse(text) as { code?: number; msg?: string; data?: { officialRank?: { all?: unknown } } };
}, 500);

export async function fetchEasyScholarRank(title: string, signal?: AbortSignal): Promise<EasyScholarResult> {
  const secretKey = (getPref("easyscholar.secretKey") || "").trim();
  if (!secretKey)
    return { status: "unconfigured" };
  const normalizedTitle = title.trim();
  if (!normalizedTitle)
    return { status: "not-found" };

  const cacheKey = `${secretKey}\n${normalizedTitle.toLocaleLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now())
    return cached.result;

  try {
    const url = new URL("https://www.easyscholar.cc/open/getPublicationRank");
    url.searchParams.set("secretKey", secretKey);
    url.searchParams.set("publicationName", normalizedTitle);
    const response = await request(url.href, signal);
    if (response.code !== 200)
      return { status: "error", message: response.msg || `EasyScholar error (${response.code ?? "unknown"})` };
    const rawRank = response.data?.officialRank?.all;
    if (!rawRank || typeof rawRank !== "object")
      return remember(cacheKey, { status: "not-found" });
    const result: EasyScholarResult = { status: "success", data: parseEasyScholarRank(rawRank) };
    return remember(cacheKey, result);
  }
  catch (error) {
    signal?.throwIfAborted();
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

function remember(key: string, result: EasyScholarResult): EasyScholarResult {
  if (cache.size >= MAX_CACHE_SIZE)
    cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + CACHE_TTL, result });
  return result;
}

export function clearEasyScholarCache() {
  cache.clear();
}
