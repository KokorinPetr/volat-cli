import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  password,
  select,
  text
} from "@clack/prompts";
import chalk from "chalk";

import {
  getConfigStorePath,
  getStoredCoinGeckoApiKey,
  saveCoinGeckoConfig,
  saveCoinGeckoApiPlan,
  saveCoinMarketCapApiKey
} from "./config/store.js";
import { EXCHANGE_OPTIONS } from "./config/exchanges.js";
import { DEFAULT_CONFIG, PROVIDER_OPTIONS } from "./constants.js";
import {
  hasAnyResolvedApiKey,
  hasResolvedCoinGeckoConfig,
  hasResolvedCoinMarketCapConfig
} from "./env.js";
import type { ExchangeId, ExchangeMatchMode, ProviderId, ScreenerConfig } from "./types/index.js";
import { clampResultLimit } from "./utils.js";

function parseInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseFloatValue(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function promptInteger(message: string, initialValue: number, min?: number): Promise<number> {
  const result = await text({
    message,
    placeholder: String(initialValue),
    defaultValue: String(initialValue),
    validate(value) {
      const parsed = parseInteger(value);

      if (parsed === null) {
        return "Enter a whole number.";
      }

      if (typeof min === "number" && parsed < min) {
        return `Enter a value greater than or equal to ${min}.`;
      }

      return undefined;
    }
  });

  if (isCancel(result)) {
    cancel("Screening cancelled.");
    process.exit(0);
  }

  return parseInteger(result)!;
}

async function promptDecimal(message: string, initialValue: number, min?: number): Promise<number> {
  const result = await text({
    message,
    placeholder: String(initialValue),
    defaultValue: String(initialValue),
    validate(value) {
      const parsed = parseFloatValue(value);

      if (parsed === null) {
        return "Enter a valid number.";
      }

      if (typeof min === "number" && parsed < min) {
        return `Enter a value greater than or equal to ${min}.`;
      }

      return undefined;
    }
  });

  if (isCancel(result)) {
    cancel("Screening cancelled.");
    process.exit(0);
  }

  return parseFloatValue(result)!;
}

async function promptOptionalSecret(
  message: string,
  required: boolean
): Promise<string | undefined> {
  const result = await password({
    message,
    mask: "*",
    validate(value) {
      if (required && value.trim().length === 0) {
        return "This value is required.";
      }

      return undefined;
    }
  });

  if (isCancel(result)) {
    cancel("Configuration cancelled.");
    process.exit(0);
  }

  const normalized = result.trim();
  return normalized.length > 0 ? normalized : undefined;
}

async function runSetupWizard(requiredProviders: ProviderId[], title: string): Promise<void> {
  intro(chalk.hex("#38bdf8")(title));
  note(
    `Saved configuration path:\n${getConfigStorePath()}\n\nPriority order:\n1. Environment variables\n2. Saved local config\n3. Manual input`,
    chalk.dim("Credential storage")
  );

  if (requiredProviders.includes("coingecko")) {
    const planResult = await select({
      message: "Select your CoinGecko API plan:",
      options: [
        { value: "demo", label: "Demo", hint: "Use api.coingecko.com with x-cg-demo-api-key" },
        { value: "pro", label: "Pro", hint: "Use pro-api.coingecko.com with x-cg-pro-api-key" }
      ],
      initialValue: "demo"
    });

    if (isCancel(planResult)) {
      cancel("Configuration cancelled.");
      process.exit(0);
    }

    const coinGeckoApiKey = await promptOptionalSecret(
      hasResolvedCoinGeckoConfig()
        ? "Enter CoinGecko API key (leave blank to keep current value):"
        : "Enter CoinGecko API key:",
      !hasResolvedCoinGeckoConfig()
    );

    if (coinGeckoApiKey) {
      saveCoinGeckoConfig(coinGeckoApiKey, planResult as "demo" | "pro");
    } else if (getStoredCoinGeckoApiKey()) {
      saveCoinGeckoApiPlan(planResult as "demo" | "pro");
    }
  }

  if (requiredProviders.includes("coinmarketcap")) {
    const coinMarketCapApiKey = await promptOptionalSecret(
      hasResolvedCoinMarketCapConfig()
        ? "Enter CoinMarketCap API key (leave blank to keep current value):"
        : "Enter CoinMarketCap API key:",
      !hasResolvedCoinMarketCapConfig()
    );

    if (coinMarketCapApiKey) {
      saveCoinMarketCapApiKey(coinMarketCapApiKey);
    }
  }

  outro(chalk.green("Configuration saved."));
}

async function ensureStartupSetup(): Promise<void> {
  if (hasAnyResolvedApiKey()) {
    return;
  }

  await runSetupWizard(["coingecko"], "Initial Setup Wizard");
}

async function ensureProviderCredentials(selectedProviders: ProviderId[]): Promise<void> {
  const missingProviders = selectedProviders.filter((providerId) => {
    if (providerId === "coingecko") {
      return !hasResolvedCoinGeckoConfig();
    }

    if (providerId === "coinmarketcap") {
      return !hasResolvedCoinMarketCapConfig();
    }

    return false;
  });

  if (missingProviders.length === 0) {
    return;
  }

  await runSetupWizard(missingProviders, "Provider Credential Setup");
}

export async function runConfigCommand(): Promise<void> {
  const shouldOpenSetup = await confirm({
    message: "Open configuration wizard to save or update API keys?",
    initialValue: true
  });

  if (isCancel(shouldOpenSetup) || !shouldOpenSetup) {
    return;
  }

  await runSetupWizard(["coingecko", "coinmarketcap"], "Configuration Wizard");
}

export async function collectConfig(): Promise<ScreenerConfig> {
  await ensureStartupSetup();
  intro(chalk.hex("#38bdf8")("Crypto Volatility Screener"));
  note(
    [
      `${chalk.bold("Navigation")}`,
      "Use Enter to confirm each step.",
      "Use Tab to move focus when available.",
      "In exchange selection: use Up/Down arrows to move, Space to toggle, Enter to confirm.",
      "Use Ctrl+C anytime to exit."
    ].join("\n"),
    chalk.dim("How to use")
  );

  const selectedProvidersResult = await multiselect({
    message: "Choose market data providers:",
    options: PROVIDER_OPTIONS.map((provider) => ({
      value: provider.value,
      label: provider.label,
      hint: provider.hint
    })),
    initialValues: DEFAULT_CONFIG.selectedProviders,
    required: true
  });

  if (isCancel(selectedProvidersResult)) {
    cancel("Screening cancelled.");
    process.exit(0);
  }

  const selectedProviders = selectedProvidersResult as ProviderId[];
  await ensureProviderCredentials(selectedProviders);

  const selectedProviderLabels = PROVIDER_OPTIONS
    .filter((provider) => selectedProviders.includes(provider.value))
    .map((provider) => provider.label)
    .join(", ");

  const minRank = await promptInteger(
    "Enter the minimum market cap rank (e.g., 100):",
    DEFAULT_CONFIG.minRank,
    1
  );

  const maxRank = await promptInteger(
    "Enter the maximum market cap rank (e.g., 500):",
    DEFAULT_CONFIG.maxRank,
    minRank
  );

  const minVolatility = await promptDecimal(
    "Enter minimum daily volatility % (e.g., 10):",
    DEFAULT_CONFIG.minVolatility,
    0
  );

  const requestedLimit = await promptInteger(
    "How many results to display? (Max 20):",
    DEFAULT_CONFIG.limit,
    1
  );

  const selectedExchangesResult = await multiselect({
    message: "Choose target exchanges:",
    options: EXCHANGE_OPTIONS.map((exchange) => ({
      value: exchange.value,
      label: exchange.label,
      hint: exchange.hint
    })),
    initialValues: DEFAULT_CONFIG.selectedExchanges,
    required: true
  });

  if (isCancel(selectedExchangesResult)) {
    cancel("Screening cancelled.");
    process.exit(0);
  }

  const selectedExchanges = selectedExchangesResult as ExchangeId[];
  const selectedExchangeLabels = EXCHANGE_OPTIONS
    .filter((exchange) => selectedExchanges.includes(exchange.value))
    .map((exchange) => exchange.label)
    .join(", ");

  const exchangeMatchModeResult = await select({
    message: "Should coins be traded on any selected exchange or all selected exchanges?",
    options: [
      {
        value: "any",
        label: "Any selected exchange",
        hint: "Show coins listed on at least one selected venue"
      },
      {
        value: "all",
        label: "All selected exchanges",
        hint: "Only show coins listed on every selected venue"
      }
    ],
    initialValue: DEFAULT_CONFIG.exchangeMatchMode
  });

  if (isCancel(exchangeMatchModeResult)) {
    cancel("Screening cancelled.");
    process.exit(0);
  }

  const exchangeMatchMode = exchangeMatchModeResult as ExchangeMatchMode;

  const config: ScreenerConfig = {
    selectedProviders,
    minRank,
    maxRank,
    minVolatility,
    minDailyVolume: DEFAULT_CONFIG.minDailyVolume,
    limit: clampResultLimit(requestedLimit),
    selectedExchanges,
    exchangeMatchMode
  };

  note(
    `Providers ${selectedProviderLabels}\nRanks ${config.minRank}-${config.maxRank}\nMin volatility ${config.minVolatility}%\nMin 24h volume ${config.minDailyVolume.toLocaleString("en-US")} USD\nTop results ${config.limit}\nExchanges ${selectedExchangeLabels}\nExchange match ${config.exchangeMatchMode === "all" ? "all selected" : "any selected"}`,
    chalk.dim("Scan configuration")
  );

  return config;
}
