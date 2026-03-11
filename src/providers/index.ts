import { coingeckoConnector } from "./coingecko.js";
import { coinmarketcapConnector } from "./coinmarketcap.js";
import type { MarketDataConnector, ProviderId } from "../types/index.js";

const CONNECTORS: Record<ProviderId, MarketDataConnector> = {
  coingecko: coingeckoConnector,
  coinmarketcap: coinmarketcapConnector
};

export function getConnectors(providerIds: ProviderId[]): MarketDataConnector[] {
  return providerIds.map((providerId) => CONNECTORS[providerId]);
}

export function getConnector(providerId: ProviderId): MarketDataConnector {
  return CONNECTORS[providerId];
}
