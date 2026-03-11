import { confirm, isCancel, note, text } from "@clack/prompts";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { ScreenedCoin } from "./types/index.js";

function escapeCsvCell(value: string | number): string {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

function buildCsv(results: ScreenedCoin[]): string {
  const header = [
    "Rank",
    "Ticker",
    "Name",
    "Current Price",
    "24h Low",
    "24h High",
    "24h Volume",
    "Volatility %",
    "Providers",
    "Selected Exchanges",
    "Top 3 Exchanges"
  ];

  const rows = results.map((coin) => [
    coin.rank,
    coin.symbol,
    coin.name,
    coin.currentPrice,
    coin.low24h,
    coin.high24h,
    coin.totalVolume,
    coin.volatilityPercent,
    coin.sourceProviders.join("; "),
    coin.selectedExchanges.join("; "),
    coin.topExchanges.join("; ")
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function buildDefaultFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
  return `crypto-volatility-screener-${timestamp}.csv`;
}

function ensureCsvExtension(fileNameOrPath: string): string {
  return fileNameOrPath.toLowerCase().endsWith(".csv") ? fileNameOrPath : `${fileNameOrPath}.csv`;
}

export async function maybeExportResults(results: ScreenedCoin[]): Promise<void> {
  if (results.length === 0) {
    return;
  }

  const shouldExport = await confirm({
    message: "Do you want to export these results to a CSV file?",
    initialValue: false
  });

  if (isCancel(shouldExport)) {
    return;
  }

  if (!shouldExport) {
    return;
  }

  const defaultFileName = buildDefaultFileName();
  const requestedPath = await text({
    message: "Enter CSV file name or path:",
    defaultValue: defaultFileName,
    placeholder: defaultFileName
  });

  if (isCancel(requestedPath)) {
    return;
  }

  const normalizedPath = ensureCsvExtension(requestedPath.trim() || defaultFileName);
  const resolvedPath = path.resolve(process.cwd(), normalizedPath);
  await writeFile(resolvedPath, buildCsv(results), "utf8");

  note(resolvedPath, "CSV exported");
}
