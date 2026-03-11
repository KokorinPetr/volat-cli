import { EXCHANGE_LABELS } from "./config/exchanges.js";
import type { ScreenerEngine } from "./engine/ScreenerEngine.js";
import { getConnector } from "./providers/index.js";
import type { CoinTicker, ScreenedCoin, ScreenerConfig } from "./types/index.js";

async function fetchTickersForCoin(
  coin: ScreenedCoin,
  filterExchangeIds?: ScreenerConfig["selectedExchanges"]
): Promise<CoinTicker[]> {
  const tickerGroups = await Promise.all(
    coin.providerRefs
      .filter((providerRef) => getConnector(providerRef.providerId).supportsExchangeTickers)
      .map((providerRef) => getConnector(providerRef.providerId).fetchCoinTickers(providerRef.coinId, filterExchangeIds))
  );

  return tickerGroups.flat();
}

export async function enrichCoinsWithExchangeData(
  candidates: ScreenedCoin[],
  config: ScreenerConfig,
  screenerEngine: ScreenerEngine
): Promise<ScreenedCoin[]> {
  const selectedExchangeIds = new Set(config.selectedExchanges);
  const qualifiedResults: ScreenedCoin[] = [];

  // Sequential requests are slower, but they reduce the chance of tripping CoinGecko rate limits.
  for (const coin of candidates) {
    const selectedExchangeTickers = await fetchTickersForCoin(coin, config.selectedExchanges);

    if (!screenerEngine.matchesSelectedExchanges(selectedExchangeTickers, selectedExchangeIds, config.exchangeMatchMode)) {
      continue;
    }

    const allTickers = await fetchTickersForCoin(coin);
    const topExchanges = screenerEngine.extractTopExchangeNames(allTickers);
    const matchedSelectedExchanges = screenerEngine.extractSelectedExchangeNames(selectedExchangeTickers);
    const fallbackSelectedExchanges = config.selectedExchanges
      .map((exchangeId) => EXCHANGE_LABELS.get(exchangeId))
      .filter((exchangeName): exchangeName is string => Boolean(exchangeName));

    qualifiedResults.push({
      ...coin,
      selectedExchanges: matchedSelectedExchanges.length > 0 ? matchedSelectedExchanges : fallbackSelectedExchanges,
      topExchanges: topExchanges.length > 0 ? topExchanges : screenerEngine.extractTopExchangeNames(selectedExchangeTickers)
    });

    if (qualifiedResults.length >= config.limit) {
      break;
    }
  }

  return qualifiedResults;
}
