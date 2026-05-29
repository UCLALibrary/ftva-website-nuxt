# Nuxt 3 FTVA website

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

:exclamation: Verify that your development environment runs the Node and PNPM versions referenced in the project's [`actions.yml` file](https://github.com/UCLALibrary/ftva-website-nuxt/blob/main/.github/workflows/setup-workspace/action.yml)

```bash
# node some silly change to trigger a PR
node -v
```

```bash
# pnpm
pnpm -v
```

If your global Node or PNPM version is different, use the respective version setup steps:
- [Node version setup](#node-version-setup)
- [PNPM version setup](#pnpm-version-setup-important)

Install the project dependencies:

```bash
# pnpm
pnpm install
```

:exclamation: Make sure local `.env` is updated before running dev server *(Request .env settings from team)*

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
```

If the data is not appearing on listing pages that use Elastic Search run `pnpm run generate` to load the data.

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

## Addendum

### Node Version Setup

- Verify current version: `node -v`

- If the current node verison is different from the project node version, check for other existing versions: `nvm list` or `nvm ls`

- You should/may see an output such as this:

```bash
-> v20.18.3
   v22.22.0
   v26.2.0
default -> 20.18.3 (-> v20.18.3 *)
```

- Install the project node version if it is not listed: `nvm install version-number` (Example: `nvm install 20.20.2`)

- Verify project version is installed: `nvm list` or `nvm ls`

- Switch to use project node version: `nvm use version-number` (Example: `nvm use 20.20.2`)

- Verify the project version: `node -v`

:bulb: **To set specific node version as the global default:** `nvm alias default version-number`

## PNPM Version Setup (Important)

This project requires pnpm `^9.12.1`.

If you are using a different global pnpm version (for example, v10+), you may see this error:

    ERR_PNPM_UNSUPPORTED_ENGINE
    Expected version: ^9.12.1
    Got: 10.x.x

### Recommended setup: use Corepack

Node.js includes Corepack, which lets different projects use different pnpm versions.

1. Enable Corepack:

    `corepack enable`

2. Set the correct pnpm version for this project:

    `corepack use pnpm@9.12.1`

3. Verify the version:

    `pnpm -v`

    # should output 9.12.1

4. Run commands as usual:

    `pnpm install`

    `pnpm lint`

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
