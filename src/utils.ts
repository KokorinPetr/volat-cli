import chalk from "chalk";

export function clearConsole(): void {
  process.stdout.write("\x1Bc");
}

export function renderBanner(): void {
  const lines = [
    "  ______                 __         _    __      ____      __      _ __",
    " / ____/______  ______  / /_____   | |  / /___  / / /___ _/ /_____(_) /___  __",
    "/ /   / ___/ / / / __ \\/ __/ __ \\  | | / / __ \\/ / / __ `/ __/ __/ / / __ \\/ /",
    "/ /___/ /  / /_/ / /_/ / /_/ /_/ /  | |/ / /_/ / / / /_/ / /_/ /_/ / / /_/ / / ",
    "\\____/_/   \\__, / .___/\\__/\\____/   |___/\\____/_/_/\\__,_/\\__/\\__/_/_/\\____/_/  ",
    "          /____/_/                                                               "
  ];

  console.log(chalk.hex("#22c55e")(lines.join("\n")));
  console.log(chalk.hex("#f59e0b")("Market turbulence scanner for arbitrage candidate discovery.\n"));
}

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function clampResultLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), 20);
}

export function colorizeVolatility(value: number): string {
  if (value > 20) {
    return chalk.greenBright(formatPercent(value));
  }

  if (value > 10) {
    return chalk.yellowBright(formatPercent(value));
  }

  return chalk.white(formatPercent(value));
}
