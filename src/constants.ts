import type { ProviderOption, ScreenerConfig } from "./types/index.js";

export const DEFAULT_CONFIG: ScreenerConfig = {
  selectedProviders: ["coingecko"],
  minRank: 100,
  maxRank: 500,
  minVolatility: 15,
  minDailyVolume: 500_000,
  limit: 10,
  selectedExchanges: ["binance", "okx", "bybit_spot"],
  exchangeMatchMode: "any"
};

export const COINS_PER_PAGE = 250;

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    value: "coingecko",
    label: "CoinGecko",
    hint: "Market ranks, prices, and tickers"
  },
  {
    value: "coinmarketcap",
    label: "CoinMarketCap",
    hint: "Extra market source for merged pricing data"
  }
];

export const PROVIDER_LABELS = new Map(
  PROVIDER_OPTIONS.map((provider) => [provider.value, provider.label] as const)
);
