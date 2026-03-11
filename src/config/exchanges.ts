import type { ExchangeOption } from "../types/index.js";

export const EXCHANGE_OPTIONS: ExchangeOption[] = [
  {
    value: "binance",
    label: "Binance",
    hint: "Deep global spot liquidity"
  },
  {
    value: "okx",
    label: "OKX",
    hint: "Large multi-market venue"
  },
  {
    value: "bybit_spot",
    label: "Bybit",
    hint: "High-activity spot order flow"
  },
  {
    value: "kucoin",
    label: "KuCoin",
    hint: "Broad altcoin coverage"
  },
  {
    value: "gate",
    label: "Gate.io",
    hint: "Long-tail listing depth"
  },
  {
    value: "kraken",
    label: "Kraken",
    hint: "Established fiat-linked venue"
  }
];

export const EXCHANGE_LABELS = new Map(
  EXCHANGE_OPTIONS.map((exchange) => [exchange.value, exchange.label] as const)
);

// Canonical internal exchange ids for matching across provider-specific aliases.
export const EXCHANGE_IDENTIFIER_ALIASES = new Map<string, string>([
  ["okx", "okx"],
  ["okex", "okx"],
  ["bybit", "bybit_spot"],
  ["bybit_spot", "bybit_spot"],
  ["gate", "gate"],
  ["gate-io", "gate"],
  ["gate_io", "gate"],
  ["kucoin", "kucoin"],
  ["binance", "binance"],
  ["kraken", "kraken"]
]);

// Provider-specific exchange ids should be mapped here, not in the connector logic.
export const COINGECKO_EXCHANGE_ID_MAP = new Map<string, string>([
  ["okx", "okex"],
  ["bybit_spot", "bybit_spot"],
  ["binance", "binance"],
  ["kucoin", "kucoin"],
  ["gate", "gate"],
  ["kraken", "kraken"]
]);
