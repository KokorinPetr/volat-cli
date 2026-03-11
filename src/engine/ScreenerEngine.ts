import { EXCHANGE_IDENTIFIER_ALIASES } from "../config/exchanges.js";
import type {
  CoinTicker,
  ExchangeMatchMode,
  MarketCoin,
  ScreenedCoin,
  ScreenerConfig
} from "../types/index.js";

const STABLECOIN_KEYWORDS = [
  "usdt",
  "usdc",
  "busd",
  "dai",
  "fdusd",
  "tusd",
  "usde",
  "gusd",
  "lusd",
  "eurc",
  "pyusd",
  "stable"
];

const STABLECOIN_SYMBOLS = new Set([
  "usdt",
  "usdc",
  "busd",
  "dai",
  "fdusd",
  "tusd",
  "usde",
  "gusd",
  "lusd",
  "eurc",
  "pyusd",
  "usdd",
  "usdp",
  "rlusd"
]);

export class ScreenerEngine {
  screenCoins(coins: MarketCoin[], config: ScreenerConfig): ScreenedCoin[] {
    const candidates: Array<ScreenedCoin | null> = coins
      .filter((coin) => !this.looksLikeStablecoin(coin))
      .map((coin) => {
        const volatilityPercent = this.calculateVolatilityPercent(coin);

        if (
          volatilityPercent === null ||
          coin.marketCapRank === null ||
          coin.currentPrice === null ||
          coin.high24h === null ||
          coin.low24h === null ||
          coin.totalVolume === null ||
          coin.totalVolume < config.minDailyVolume
        ) {
          return null;
        }

        return {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          rank: coin.marketCapRank,
          currentPrice: coin.currentPrice,
          high24h: coin.high24h,
          low24h: coin.low24h,
          totalVolume: coin.totalVolume,
          volatilityPercent,
          selectedExchanges: [],
          topExchanges: [],
          sourceProviders: coin.sourceProviders,
          providerRefs: coin.providerRefs
        };
      });

    return candidates
      .filter((coin): coin is ScreenedCoin => coin !== null && coin.volatilityPercent >= config.minVolatility)
      .sort((left, right) => right.volatilityPercent - left.volatilityPercent);
  }

  extractTopExchangeNames(tickers: CoinTicker[], limit = 3): string[] {
    const rankedExchangeNames = new Map<string, number>();

    for (const ticker of tickers) {
      const exchangeName = ticker.market?.name?.trim();

      if (!exchangeName) {
        continue;
      }

      const volume = ticker.convertedVolumeUsd;
      const current = rankedExchangeNames.get(exchangeName) ?? 0;
      rankedExchangeNames.set(exchangeName, Math.max(current, volume));
    }

    return [...rankedExchangeNames.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
      .map(([exchangeName]) => exchangeName);
  }

  extractSelectedExchangeNames(tickers: CoinTicker[]): string[] {
    return [...new Set(
      tickers
        .map((ticker) => ticker.market?.name?.trim())
        .filter((exchangeName): exchangeName is string => Boolean(exchangeName))
    )];
  }

  matchesSelectedExchanges(
    tickers: CoinTicker[],
    selectedExchangeIds: ReadonlySet<string>,
    matchMode: ExchangeMatchMode
  ): boolean {
    const normalizedSelectedExchangeIds = new Set(
      [...selectedExchangeIds].map((exchangeId) => this.normalizeExchangeIdentifier(exchangeId))
    );

    const matchedIdentifiers = new Set(
      tickers
        .map((ticker) => ticker.market?.identifier?.trim().toLowerCase())
        .filter((identifier): identifier is string => typeof identifier === "string")
        .map((identifier) => this.normalizeExchangeIdentifier(identifier))
        .filter((identifier) => normalizedSelectedExchangeIds.has(identifier))
    );

    if (matchMode === "all") {
      return [...normalizedSelectedExchangeIds].every((exchangeId) => matchedIdentifiers.has(exchangeId));
    }

    return matchedIdentifiers.size > 0;
  }

  private looksLikeStablecoin(coin: MarketCoin): boolean {
    const normalizedSymbol = coin.symbol.toLowerCase();
    const haystack = `${coin.id} ${coin.name}`.toLowerCase();

    if (STABLECOIN_SYMBOLS.has(normalizedSymbol)) {
      return true;
    }

    return STABLECOIN_KEYWORDS.some((keyword) => haystack.includes(keyword));
  }

  private calculateVolatilityPercent(coin: MarketCoin): number | null {
    const high = coin.high24h;
    const low = coin.low24h;

    if (high === null || low === null || low <= 0) {
      return null;
    }

    return ((high - low) / low) * 100;
  }

  private normalizeExchangeIdentifier(identifier: string): string {
    return EXCHANGE_IDENTIFIER_ALIASES.get(identifier.trim().toLowerCase()) ?? identifier.trim().toLowerCase();
  }
}
