import Table from "cli-table3";
import chalk from "chalk";

import { PROVIDER_LABELS } from "./constants.js";
import type { ScreenedCoin } from "./types/index.js";
import { colorizeVolatility, formatCurrency } from "./utils.js";

export function renderResultsTable(results: ScreenedCoin[]): void {
  if (results.length === 0) {
    console.log(chalk.yellow("No coins matched the selected volatility threshold in the requested rank range."));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyanBright("Rank"),
      chalk.cyanBright("Ticker"),
      chalk.cyanBright("Current Price"),
      chalk.cyanBright("24h Low"),
      chalk.cyanBright("24h High"),
      chalk.cyanBright("Volatility %"),
      chalk.cyanBright("Providers"),
      chalk.cyanBright("Selected Exchanges"),
      chalk.cyanBright("Top 3 Exchanges")
    ],
    style: {
      head: [],
      border: []
    },
    colAligns: ["right", "center", "right", "right", "right", "right", "left", "left", "left"],
    wordWrap: true,
    colWidths: [8, 10, 16, 16, 16, 14, 16, 24, 24]
  });

  for (const coin of results) {
    table.push([
      chalk.whiteBright(String(coin.rank)),
      chalk.bold(coin.symbol),
      formatCurrency(coin.currentPrice),
      formatCurrency(coin.low24h),
      formatCurrency(coin.high24h),
      colorizeVolatility(coin.volatilityPercent),
      coin.sourceProviders.map((providerId) => PROVIDER_LABELS.get(providerId) ?? providerId).join(", "),
      coin.selectedExchanges.join(", "),
      coin.topExchanges.join(", ")
    ]);
  }

  console.log(table.toString());
}
