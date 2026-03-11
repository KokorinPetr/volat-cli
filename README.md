# volat

Interactive TypeScript CLI for finding high-volatility crypto assets across configurable market-cap ranges and exchange filters.

The CLI is designed for arbitrage and market-scanning workflows:

- step-by-step terminal wizard with `@clack/prompts`
- provider-based market data architecture
- exchange-aware screening
- optional CSV export

## Installation

### Requirements

- Node.js `20+`
- npm

### Local Development

```bash
npm install
npm run start
```

On first launch, `volat` opens a setup wizard and asks for the provider API keys it needs. The values are saved in the user config directory via `conf` and reused on later runs.

If you prefer environment variables instead of saved local config, copy `.env.example` to `.env` and fill in only the providers you plan to use.

### Launching As `volat`

For local development on your machine:

```bash
npm run build
npm link
volat
```

After publishing to npm, users will be able to run it without cloning the repository:

```bash
npm install -g volat
volat
```

or:

```bash
npx volat
```

To open the saved credential manager later:

```bash
volat config
```

### Useful Scripts

```bash
npm run start
npm run dev
npm run typecheck
npm run build
```

## Configuration

Environment variables are defined in [`.env.example`](./.env.example).

### Supported Variables

```env
COINGECKO_API_KEY=your_coingecko_api_key_here
COINGECKO_API_PLAN=demo
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
```

### Credential Priority

The CLI resolves provider credentials in this order:

1. environment variables
2. persistent local config saved by `volat config`
3. manual setup wizard input

Persistent config is stored with the `conf` library in the system default user config directory.

### Notes

- `COINGECKO_API_KEY` is required if you use the `CoinGecko` provider.
- `COINGECKO_API_PLAN` must be `demo` or `pro`.
- `COINMARKETCAP_API_KEY` is required if you use the `CoinMarketCap` provider.
- With the current implementation, `CoinGecko` must be included for full screening because it provides the 24h high/low and exchange ticker data needed by the volatility and exchange filters.
- `CoinMarketCap` currently contributes additional market data into the merged provider result set, but does not currently satisfy all filter requirements on its own.
- If no usable credentials are found at startup, `volat` opens a one-time setup wizard and saves the values for future runs.
- Running `volat config` opens the credential wizard again so users can rotate keys or add providers later.

### Runtime Flow

When you run the CLI, you will be prompted for:

1. market data providers
2. market-cap rank range
3. minimum volatility threshold
4. result count
5. target exchanges
6. exchange match mode: `any` or `all`
7. optional CSV export after results are shown

## Adding New Providers

The project is structured so new providers can be added without rewriting the screening engine.

### Provider Contract

Every provider must implement the `MarketDataConnector` interface in [`src/types/index.ts`](./src/types/index.ts).

A provider is expected to expose:

- `id`
- `label`
- `supportsVolatilityData`
- `supportsExchangeTickers`
- `fetchCoinsForRankRange(config)`
- `fetchCoinTickers(coinId, exchangeIds?)`

### Where to Add a Provider

1. Create a connector in [`src/providers/`](./src/providers).
   Example: [`src/providers/coingecko.ts`](./src/providers/coingecko.ts)

2. Register it in [`src/providers/index.ts`](./src/providers/index.ts)

3. Add its selectable metadata to [`src/constants.ts`](./src/constants.ts)

4. Add any provider-specific environment handling in [`src/env.ts`](./src/env.ts)

### Data Model Expectations

Providers should normalize external API responses into:

- `MarketCoin`
- `CoinTicker`

These shared types live in [`src/types/index.ts`](./src/types/index.ts).

If multiple providers return the same asset, the app merges them in [`src/aggregation.ts`](./src/aggregation.ts):

- one coin appears only once in results
- numeric fields are averaged across providers
- source provider metadata is preserved

### Exchange Configuration

Exchange options and provider-specific exchange aliases are defined in [`src/config/exchanges.ts`](./src/config/exchanges.ts).

If you need to:

- add a new selectable exchange
- fix provider-specific exchange ids
- normalize naming mismatches such as `OKX` vs `okex`

this is the single place to update.

### Screening Rules

Core screening logic is isolated in [`src/engine/ScreenerEngine.ts`](./src/engine/ScreenerEngine.ts).

This includes:

- stablecoin filtering
- volatility calculation
- minimum volume filtering
- exchange matching logic
- top-exchange extraction

## Project Structure

```text
src/
  config/
    exchanges.ts
  engine/
    ScreenerEngine.ts
  providers/
    coingecko.ts
    coinmarketcap.ts
    index.ts
  types/
    index.ts
  aggregation.ts
  enrichment.ts
  export.ts
  prompts.ts
  table.ts
  app.ts
  index.ts
```

## Development

Before opening a pull request, at minimum run:

```bash
npm run typecheck
```

If you add a new provider or exchange mapping, keep the following aligned:

- [`src/types/index.ts`](./src/types/index.ts)
- [`src/config/exchanges.ts`](./src/config/exchanges.ts)
- [`src/providers/index.ts`](./src/providers/index.ts)
- [`.env.example`](./.env.example)
