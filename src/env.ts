import {
  getStoredCoinGeckoApiKey,
  getStoredCoinGeckoApiPlan,
  getStoredCoinMarketCapApiKey
} from "./config/store.js";

type CoinGeckoApiPlan = "demo" | "pro";

let hasLoadedLocalEnvFile = false;

function loadLocalEnvFile(): void {
  if (hasLoadedLocalEnvFile || typeof process.loadEnvFile !== "function") {
    return;
  }

  hasLoadedLocalEnvFile = true;

  try {
    process.loadEnvFile(".env");
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

function readOptionalValue(name: string): string | undefined {
  loadLocalEnvFile();
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readRequiredValue(value: string | undefined, errorMessage: string): string {
  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

function readCoinGeckoPlan(): CoinGeckoApiPlan {
  loadLocalEnvFile();
  const rawValue = (readOptionalValue("COINGECKO_API_PLAN") ?? getStoredCoinGeckoApiPlan() ?? "demo").trim().toLowerCase();

  if (rawValue === "demo" || rawValue === "pro") {
    return rawValue;
  }

  throw new Error("COINGECKO_API_PLAN must be either 'demo' or 'pro'.");
}

export function getCoinGeckoConfig() {
  const plan = readCoinGeckoPlan();
  const apiKey = readRequiredValue(
    readOptionalValue("COINGECKO_API_KEY") ?? getStoredCoinGeckoApiKey(),
    "Missing CoinGecko API key. Set COINGECKO_API_KEY, save it with `volat config`, or complete the setup wizard."
  );

  return {
    apiKey,
    plan,
    baseUrl: plan === "pro" ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3",
    apiKeyHeader: plan === "pro" ? "x-cg-pro-api-key" : "x-cg-demo-api-key"
  } as const;
}

export function getCoinMarketCapConfig() {
  const apiKey = readRequiredValue(
    readOptionalValue("COINMARKETCAP_API_KEY") ?? getStoredCoinMarketCapApiKey(),
    "Missing CoinMarketCap API key. Set COINMARKETCAP_API_KEY, save it with `volat config`, or complete the setup wizard."
  );

  return {
    apiKey,
    baseUrl: "https://pro-api.coinmarketcap.com"
  } as const;
}

export function hasResolvedCoinGeckoConfig(): boolean {
  return Boolean(readOptionalValue("COINGECKO_API_KEY") ?? getStoredCoinGeckoApiKey());
}

export function hasResolvedCoinMarketCapConfig(): boolean {
  return Boolean(readOptionalValue("COINMARKETCAP_API_KEY") ?? getStoredCoinMarketCapApiKey());
}

export function hasAnyResolvedApiKey(): boolean {
  return hasResolvedCoinGeckoConfig() || hasResolvedCoinMarketCapConfig();
}
