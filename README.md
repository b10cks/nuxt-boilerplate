# (Opinionated) Nuxt + b10cks CMS boilerplate

## Features

- Base Framework is [Nuxt 4](https://nuxt.com/docs/getting-started/introduction)
- Uses [b10cks CMS](https://b10cks.com)
- Provides a basic content structure to get started
- Includes [VueUse](https://vueuse.org/) for common Vue utilities
- Includes [Tailwind CSS](https://tailwindcss.com/docs) for styling
- Includes [nuxt-schema-org](https://nuxt.com/modules/schema-org) for structured data
- TypeScript support
- Configures OxLint and OxFmt with opinionated rules
- Sensible defaults for [Zed editor](https://zed.dev)

## Prerequisites

- [Node.js](https://nodejs.org/) (version 22 or higher)
- [bun](https://bun.sh/)

Make sure you've installed the b10cks CLI:

```sh
# Using bun
bun install -g b10cks-cli
# Using npm
npm install -g b10cks-cli
# Using yarn
yarn global add b10cks-cli
```

## Using this boilerplate in a new project

Use the following command to create a new project based on this boilerplate. Replace `<project-name>` with the actual name of your project.

```sh
# bun
bunx create b10cks/nuxt-boilerplate <project-name>
# npm
npx degit b10cks/nuxt-boilerplate <project-name>
```

## b10cks Setup

Follow these steps to set up b10cks:

1. Create a new b10cks account at [b10cks.com](https://b10cks.com).
2. Create a new space in b10cks.
3. Create a new API token in the space settings
   1. Go to `Configuration > Access Tokens` and click `Generate Token`.
   2. Copy the token and put into `.env` file.
4. Login via the CLI using `b10cks login`

## Setup

```sh
# bun
bun install
# npm
npm install
# yarn
yarn install
```

The dev server runs over HTTPS, so it needs `localhost.crt` and `localhost.key` in the project root. Create a self-signed pair with:

```sh
openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=localhost"
```

## Development Server

Start the development server on `https://localhost:3001`:

```bash
# bun
bun run dev
# npm
npm run dev
# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# bun
bun run build
# npm
npm run build
# yarn
yarn build
```

Locally preview production build:

```bash
# bun
bun run preview
# npm
npm run preview
# yarn
yarn preview
```

## Deploying behind a CDN

Any CDN in front of this app **must** include `b10cks_rv` and `b10cks_vid` in its cache key.

Those are the two query params the b10cks editor uses to request a specific revision and a specific version. A CDN that strips them from the cache key answers a preview request with the cached published page, so editors see stale content and cannot tell why. This is the easiest way to break preview in production.

On CloudFront, add both to the cache policy's query string allowlist. On Cloudflare, add them to the Cache Key query string include list.

## License

[MIT](./LICENSE)
