import { COINGECKO_EXCHANGE_ID_MAP } from "../config/exchanges.js";
import { COINS_PER_PAGE } from "../constants.js";
import { getCoinGeckoConfig } from "../env.js";
import type {
  CoinTicker,
  ExchangeId,
  MarketCoin,
  MarketDataConnector,
  ScreenerConfig
} from "../types/index.js";

interface CoinGeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number | null;
  current_price: number | null;
  high_24h: number | null;
  low_24h: number | null;
  total_volume: number | null;
}

interface CoinGeckoTicker {
  market?: {
    name?: string;
    identifier?: string;
  };
  converted_volume?: {
    usd?: number;
  };
}

function createMarketsUrl(page: number): URL {
  const coingeckoConfig = getCoinGeckoConfig();
  const url = new URL(`${coingeckoConfig.baseUrl}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(COINS_PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");
  url.searchParams.set("locale", "en");
  return url;
}

function createCoinTickersUrl(coinId: string, page: number, exchangeIds?: ExchangeId[]): URL {
  const coingeckoConfig = getCoinGeckoConfig();
  const url = new URL(`${coingeckoConfig.baseUrl}/coins/${coinId}/tickers`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("order", "volume_desc");
  url.searchParams.set("depth", "false");
  url.searchParams.set("dex_pair_format", "symbol");

  if (exchangeIds && exchangeIds.length > 0) {
    const providerExchangeIds = exchangeIds.map(
      (exchangeId) => COINGECKO_EXCHANGE_ID_MAP.get(exchangeId) ?? exchangeId
    );
    url.searchParams.set("exchange_ids", providerExchangeIds.join(","));
  }

  return url;
}

async function readErrorMessage(response: Response): Promise<string> {
  const rawBody = await response.text();

  if (response.status === 429) {
    return "CoinGecko rate limit hit. Wait a moment and run the screener again.";
  }

  try {
    const parsed = JSON.parse(rawBody) as { error?: string; status?: { error_message?: string } };
    const message = parsed.error ?? parsed.status?.error_message;

    if (message?.includes("10010")) {
      return "CoinGecko says this key should use the Pro API base URL. Set COINGECKO_API_PLAN=pro in .env.";
    }

    if (message?.includes("10011")) {
      return "CoinGecko says this key should use the Demo API base URL. Set COINGECKO_API_PLAN=demo in .env.";
    }

    if (message?.includes("10002")) {
      return "CoinGecko did not receive an API key. Verify COINGECKO_API_KEY is present in .env and that the app was restarted.";
    }

    if (message) {
      return `CoinGecko request failed: ${message}`;
    }
  } catch {
    if (rawBody.trim().length > 0) {
      return `CoinGecko request failed: ${rawBody.trim()}`;
    }
  }

  return `CoinGecko request failed with status ${response.status}.`;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const coingeckoConfig = getCoinGeckoConfig();
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      [coingeckoConfig.apiKeyHeader]: coingeckoConfig.apiKey
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

function normalizeMarketCoin(coin: CoinGeckoMarketCoin): MarketCoin {
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    marketCapRank: coin.market_cap_rank,
    currentPrice: coin.current_price,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    totalVolume: coin.total_volume,
    providerRefs: [
      {
        providerId: "coingecko",
        coinId: coin.id
      }
    ],
    sourceProviders: ["coingecko"]
  };
}

function normalizeTicker(ticker: CoinGeckoTicker): CoinTicker {
  const normalizedTicker: CoinTicker = {
    convertedVolumeUsd: ticker.converted_volume?.usd ?? 0
  };

  if (ticker.market) {
    normalizedTicker.market = ticker.market;
  }

  return normalizedTicker;
}

export const coingeckoConnector: MarketDataConnector = {
  id: "coingecko",
  label: "CoinGecko",
  supportsVolatilityData: true,
  supportsExchangeTickers: true,

  async fetchCoinsForRankRange(config: ScreenerConfig): Promise<MarketCoin[]> {
    const startPage = Math.floor((config.minRank - 1) / COINS_PER_PAGE) + 1;
    const endPage = Math.floor((config.maxRank - 1) / COINS_PER_PAGE) + 1;
    const collected: CoinGeckoMarketCoin[] = [];

    for (let page = startPage; page <= endPage; page += 1) {
      const pageData = await fetchJson<CoinGeckoMarketCoin[]>(createMarketsUrl(page));
      collected.push(...pageData);
    }

    return collected
      .filter((coin) => {
        const rank = coin.market_cap_rank;
        return rank !== null && rank >= config.minRank && rank <= config.maxRank;
      })
      .map(normalizeMarketCoin);
  },

  async fetchCoinTickers(coinId: string, exchangeIds?: ExchangeId[]): Promise<CoinTicker[]> {
    const data = await fetchJson<{ tickers?: CoinGeckoTicker[] }>(createCoinTickersUrl(coinId, 1, exchangeIds));

    if (!Array.isArray(data.tickers)) {
      throw new Error("Unexpected CoinGecko ticker response format.");
    }

    return data.tickers.map(normalizeTicker);
  }
};
