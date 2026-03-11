export interface ScreenerConfig {
  selectedProviders: ProviderId[];
  minRank: number;
  maxRank: number;
  minVolatility: number;
  minDailyVolume: number;
  limit: number;
  selectedExchanges: ExchangeId[];
  exchangeMatchMode: ExchangeMatchMode;
}

export type ProviderId = "coingecko" | "coinmarketcap";

export interface ProviderOption {
  value: ProviderId;
  label: string;
  hint: string;
}

export interface ProviderCoinRef {
  providerId: ProviderId;
  coinId: string;
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
  currentPrice: number | null;
  high24h: number | null;
  low24h: number | null;
  totalVolume: number | null;
  providerRefs: ProviderCoinRef[];
  sourceProviders: ProviderId[];
}

export interface ScreenedCoin {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  currentPrice: number;
  high24h: number;
  low24h: number;
  totalVolume: number;
  volatilityPercent: number;
  selectedExchanges: string[];
  topExchanges: string[];
  sourceProviders: ProviderId[];
  providerRefs: ProviderCoinRef[];
}

export type ExchangeId =
  | "binance"
  | "okx"
  | "bybit_spot"
  | "kucoin"
  | "gate"
  | "kraken";

export type ExchangeMatchMode = "any" | "all";

export interface ExchangeOption {
  value: ExchangeId;
  label: string;
  hint: string;
}

export interface CoinTicker {
  market?: {
    name?: string;
    identifier?: string;
  };
  convertedVolumeUsd: number;
}

export interface MarketDataConnector {
  readonly id: ProviderId;
  readonly label: string;
  readonly supportsVolatilityData: boolean;
  readonly supportsExchangeTickers: boolean;
  fetchCoinsForRankRange(config: ScreenerConfig): Promise<MarketCoin[]>;
  fetchCoinTickers(coinId: string, exchangeIds?: ExchangeId[]): Promise<CoinTicker[]>;
}
