# Nuxt 3 FTVA website

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

If the data is not appearing on listing pages that use Elastic Search run `pnpm run generate` to load the data.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
```

## Production

Static Build:

```bash
# pnpm
pnpm generate
```

Locally preview static build:

```bash
# pnpm
pnpm start
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

Make sure local .env is updated

New branch created for post-launch create PR against this branch for ftva bug fixes
