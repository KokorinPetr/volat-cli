# Contributing to volat-screener

Thanks for your interest in contributing. Any help is welcome — bug reports, new provider connectors, filter improvements, UX ideas, or documentation fixes.

## Ways to Contribute

### Report a Bug

[Open an issue](https://github.com/KokorinPetr/volat-cli/issues) and include:

- What you ran and what you expected to happen
- What actually happened (error message, wrong output, etc.)
- Your Node.js version (`node -v`) and OS

### Suggest a Feature or Improvement

You can either [open an issue](https://github.com/KokorinPetr/volat-cli/issues) with your idea, or send a message directly to [kokorin.petr27@gmail.com](mailto:kokorin.petr27@gmail.com). Both are welcome — no format required, just describe what you have in mind.

### Submit a Pull Request

1. Fork the repository and create your branch from `main`.
2. Make your changes.
3. Run the type checker before pushing:

```bash
npm run typecheck
```

4. Open a pull request with a short description of what you changed and why.

## Adding a New Provider

The project is structured so new providers can be plugged in without touching the screening engine. See the [Adding New Providers](./README.md#adding-new-providers) section in the README for the full walkthrough.

When adding a provider, keep these files aligned:

- `src/types/index.ts`
- `src/config/exchanges.ts`
- `src/providers/index.ts`
- `.env.example`

## Adding or Fixing Exchange Mappings

Exchange options and provider-specific ID aliases live in `src/config/exchanges.ts`. This is the single place to update when adding an exchange or fixing a naming mismatch (e.g. `OKX` vs `okex`).

## Code Style

- TypeScript throughout — no plain JS files
- Keep changes focused; avoid refactoring unrelated code in the same PR
- No new dependencies without discussion

## Questions

Not sure where to start or want to discuss an idea before writing code? Reach out at [kokorin.petr27@gmail.com](mailto:kokorin.petr27@gmail.com) — happy to help.
