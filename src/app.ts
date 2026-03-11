import { outro, spinner } from "@clack/prompts";
import chalk from "chalk";

import { mergeMarketCoins } from "./aggregation.js";
import { ScreenerEngine } from "./engine/ScreenerEngine.js";
import { enrichCoinsWithExchangeData } from "./enrichment.js";
import { maybeExportResults } from "./export.js";
import { getConnectors } from "./providers/index.js";
import { collectConfig } from "./prompts.js";
import { renderResultsTable } from "./table.js";
import { clearConsole, renderBanner } from "./utils.js";

function mapErrorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error while scanning markets.";
}

export async function runApp(): Promise<void> {
  clearConsole();
  renderBanner();

  const config = await collectConfig();
  const load = spinner();
  const screenerEngine = new ScreenerEngine();

  try {
    load.start("Scanning markets and exchange listings...");

    const connectors = getConnectors(config.selectedProviders);

    if (!connectors.some((connector) => connector.supportsVolatilityData)) {
      throw new Error("The selected providers cannot supply 24h high/low data for the volatility formula. Include CoinGecko in the provider selection.");
    }

    if (!connectors.some((connector) => connector.supportsExchangeTickers)) {
      throw new Error("The selected providers cannot supply exchange listing data for the selected-exchange filter. Include CoinGecko in the provider selection.");
    }

    const providerResults = await Promise.all(
      connectors.map((connector) => connector.fetchCoinsForRankRange(config))
    );
    const mergedCoins = mergeMarketCoins(providerResults);
    const screenedCandidates = screenerEngine.screenCoins(mergedCoins, config);
    const results = await enrichCoinsWithExchangeData(screenedCandidates, config, screenerEngine);

    load.stop(chalk.green(`Found ${results.length} volatility candidate${results.length === 1 ? "" : "s"}.`));
    console.log();
    renderResultsTable(results);
    console.log();
    await maybeExportResults(results);
    outro(chalk.hex("#38bdf8")("Scan complete."));
  } catch (error) {
    load.stop(chalk.red("Market scan failed."));
    console.error(chalk.red(mapErrorToMessage(error)));
    process.exitCode = 1;
  }
}
