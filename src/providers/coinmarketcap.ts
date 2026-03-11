import { getCoinMarketCapConfig } from "../env.js";
import type {
  CoinTicker,
  ExchangeId,
  MarketCoin,
  MarketDataConnector,
  ScreenerConfig
} from "../types/index.js";

interface CoinMarketCapQuote {
  price?: number;
  volume_24h?: number;
}

interface CoinMarketCapListing {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number | null;
  quote?: {
    USD?: CoinMarketCapQuote;
  };
}

interface CoinMarketCapResponse<T> {
  status?: {
    error_code?: number;
    error_message?: string | null;
  };
  data?: T;
}

const CMC_PAGE_SIZE = 5000;

function createListingsUrl(start: number, limit: number): URL {
  const { baseUrl } = getCoinMarketCapConfig();
  const url = new URL(`${baseUrl}/v1/cryptocurrency/listings/latest`);
  url.searchParams.set("convert", "USD");
  url.searchParams.set("start", String(start));
  url.searchParams.set("limit", String(limit));
  return url;
}

async function readErrorMessage(response: Response): Promise<string> {
  const rawBody = await response.text();

  try {
    const parsed = JSON.parse(rawBody) as CoinMarketCapResponse<unknown>;
    const message = parsed.status?.error_message;
    const errorCode = parsed.status?.error_code;

    if (errorCode === 1006) {
      return "CoinMarketCap says your current API plan does not support this endpoint.";
    }

    if (message) {
      return `CoinMarketCap request failed: ${message}`;
    }
  } catch {
    if (rawBody.trim().length > 0) {
      return `CoinMarketCap request failed: ${rawBody.trim()}`;
    }
  }

  return `CoinMarketCap request failed with status ${response.status}.`;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const coinMarketCapConfig = getCoinMarketCapConfig();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-CMC_PRO_API_KEY": coinMarketCapConfig.apiKey
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

function normalizeListing(listing: CoinMarketCapListing): MarketCoin {
  return {
    id: listing.slug,
    symbol: listing.symbol,
    name: listing.name,
    marketCapRank: listing.cmc_rank,
    currentPrice: listing.quote?.USD?.price ?? null,
    high24h: null,
    low24h: null,
    totalVolume: listing.quote?.USD?.volume_24h ?? null,
    providerRefs: [
      {
        providerId: "coinmarketcap",
        coinId: String(listing.id)
      }
    ],
    sourceProviders: ["coinmarketcap"]
  };
}

export const coinmarketcapConnector: MarketDataConnector = {
  id: "coinmarketcap",
  label: "CoinMarketCap",
  supportsVolatilityData: false,
  supportsExchangeTickers: false,

  async fetchCoinsForRankRange(config: ScreenerConfig): Promise<MarketCoin[]> {
    const collected: CoinMarketCapListing[] = [];
    let currentStart = config.minRank;
    const finalRank = config.maxRank;

    while (currentStart <= finalRank) {
      const chunkSize = Math.min(CMC_PAGE_SIZE, finalRank - currentStart + 1);
      const payload = await fetchJson<CoinMarketCapResponse<CoinMarketCapListing[]>>(
        createListingsUrl(currentStart, chunkSize)
      );

      if (!Array.isArray(payload.data)) {
        throw new Error("Unexpected CoinMarketCap listings response format.");
      }

      collected.push(...payload.data);
      currentStart += chunkSize;
    }

    return collected
      .filter((listing) => listing.cmc_rank !== null && listing.cmc_rank >= config.minRank && listing.cmc_rank <= config.maxRank)
      .map(normalizeListing);
  },

  async fetchCoinTickers(_coinId: string, _exchangeIds?: ExchangeId[]): Promise<CoinTicker[]> {
    return [];
  }
};
