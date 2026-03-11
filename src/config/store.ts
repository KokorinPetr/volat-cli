import Conf from "conf";

type CoinGeckoApiPlan = "demo" | "pro";

interface VolatPersistentConfig {
  coingeckoApiKey?: string;
  coingeckoApiPlan?: CoinGeckoApiPlan;
  coinmarketcapApiKey?: string;
}

const store = new Conf<VolatPersistentConfig>({
  projectName: "volat",
  configName: "config",
  schema: {
    coingeckoApiKey: {
      type: "string"
    },
    coingeckoApiPlan: {
      type: "string",
      enum: ["demo", "pro"]
    },
    coinmarketcapApiKey: {
      type: "string"
    }
  }
});

export function getConfigStorePath(): string {
  return store.path;
}

export function getStoredCoinGeckoApiKey(): string | undefined {
  return store.get("coingeckoApiKey");
}

export function getStoredCoinGeckoApiPlan(): CoinGeckoApiPlan | undefined {
  return store.get("coingeckoApiPlan");
}

export function getStoredCoinMarketCapApiKey(): string | undefined {
  return store.get("coinmarketcapApiKey");
}

export function saveCoinGeckoConfig(apiKey: string, plan: CoinGeckoApiPlan): void {
  store.set({
    coingeckoApiKey: apiKey,
    coingeckoApiPlan: plan
  });
}

export function saveCoinGeckoApiPlan(plan: CoinGeckoApiPlan): void {
  store.set("coingeckoApiPlan", plan);
}

export function saveCoinMarketCapApiKey(apiKey: string): void {
  store.set("coinmarketcapApiKey", apiKey);
}
