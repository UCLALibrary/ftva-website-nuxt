# Nuxt 3 FTVA website

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install these dependencies:

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

## pnpm Version Setup (Important)

This project requires pnpm `^9.12.1`.

If you are using a different global pnpm version (for example, v10+), you may see this error:

    ERR_PNPM_UNSUPPORTED_ENGINE
    Expected version: ^9.12.1
    Got: 10.x.x

### Recommended setup: use Corepack

Node.js includes Corepack, which lets different projects use different pnpm versions.

1. Enable Corepack:

    corepack enable

2. Set the correct pnpm version for this project:

    corepack use pnpm@9.12.1

3. Verify the version:

    pnpm -v

    # should output 9.12.1

4. Run commands as usual:

    pnpm install
    pnpm lint

### Important notes

- Do not downgrade your global pnpm version.
- Do not remove the `engines` field.
- This setup allows different repos to use different pnpm versions safely.

### Troubleshooting

If `pnpm -v` still shows the wrong version, run:

    hash -r
    which -a pnpm

If a global pnpm is overriding Corepack, remove it:

    npm uninstall -g pnpm
    hash -r
