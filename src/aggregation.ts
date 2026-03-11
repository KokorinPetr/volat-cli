import type { MarketCoin } from "./types/index.js";

function averageNullable(values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => value !== null);

  if (presentValues.length === 0) {
    return null;
  }

  return presentValues.reduce((sum, value) => sum + value, 0) / presentValues.length;
}

function mergeGroup(coins: MarketCoin[]): MarketCoin {
  const firstCoin = coins[0]!;
  const mergedRank = averageNullable(coins.map((coin) => coin.marketCapRank));

  return {
    id: firstCoin.id,
    symbol: firstCoin.symbol,
    name: firstCoin.name,
    marketCapRank: mergedRank === null ? null : Math.round(mergedRank),
    currentPrice: averageNullable(coins.map((coin) => coin.currentPrice)),
    high24h: averageNullable(coins.map((coin) => coin.high24h)),
    low24h: averageNullable(coins.map((coin) => coin.low24h)),
    totalVolume: averageNullable(coins.map((coin) => coin.totalVolume)),
    providerRefs: coins.flatMap((coin) => coin.providerRefs),
    sourceProviders: [...new Set(coins.flatMap((coin) => coin.sourceProviders))]
  };
}

export function mergeMarketCoins(providerCoins: MarketCoin[][]): MarketCoin[] {
  const groupedCoins = new Map<string, MarketCoin[]>();

  for (const coin of providerCoins.flat()) {
    const key = `${coin.symbol.toLowerCase()}::${coin.name.toLowerCase()}`;
    const group = groupedCoins.get(key);

    if (group) {
      group.push(coin);
      continue;
    }

    groupedCoins.set(key, [coin]);
  }

  return [...groupedCoins.values()].map(mergeGroup);
}
