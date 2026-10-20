# CLAUDE.md

Nuxt 4 + b10cks CMS boilerplate. Content comes from b10cks; the app renders it.

## Commands

```sh
bun run dev            # https://localhost:3001, needs localhost.crt / localhost.key
bun run lint           # oxlint
bun run format         # oxfmt
bun run typecheck      # nuxt typecheck
bun run types:b10cks   # regenerate app/b10cks/types/generated.d.ts
```

Run `lint`, `format` and `typecheck` after changes. Do not run `build` unless asked.

## Blocks

`app/b10cks/` is a contract, not a components folder. `@b10cks/nuxt` registers it with
`{ global: true, pathPrefix: false }`, so:

- The PascalCase filename is the CMS block slug. `HeroBanner.vue` renders the block `hero_banner`
  or `heroBanner` as the space defines it; the resolver matches on the component name.
- No subdirectories. `pathPrefix: false` strips the path, so `app/b10cks/ui/Card.vue` and
  `app/b10cks/Card.vue` collide.
- No prefix. The component is `<Card />`, not `<B10cksCard />`.
- Every block in the space needs a file here or the page renders an unknown-block placeholder.

Regular components go in `app/components/` as usual.

### Props

Every block component receives:

- `block` — the block's own content. Type it against the generated types:
  `defineProps<{ block: B10cksHeroBanner }>()`.
- `isFirst` — true for the first block in a body array. Passed by the parent, never a CMS field.
- `content` — the full `IBContent` entry. Only root blocks (the ones a page's `block` field names,
  like `Page.vue`) get this. Nested blocks read it via `inject('content')` if they need it.

Mark the block editable so the editor can select it: `<section v-editable="block">`.

### isFirst and the LCP

`isFirst` decides two things:

- Heading level. The first block renders `<h1>`, everything below it `<h2>`. Never read the level
  from a CMS field.
- Image loading. The first block's image is the LCP candidate: `loading="eager"` and
  `fetchpriority="high"`. Every other image is `loading="lazy"`.

## Images

Use `<B10cksImg v-bind="block.image" />` for CMS assets and `<NuxtImg>` for everything else.
`B10cksImg` takes an asset field whole and handles `full_path`, alt fallback, intrinsic
dimensions, crop and the editor-set focus point.

Two rules that are not optional:

- Always pass explicit breakpoint `sizes`, e.g. `sizes="xs:100vw md:50vw xl:30vw"`. Without it
  @nuxt/image ships one size to every viewport.
- Always let width and height through. They fix the aspect ratio and stop the layout shifting when
  the image arrives.

The `ilum` provider (`app/utils/providers/ilum.ts`) is the default and reads
`NUXT_ILUM_BASE_URL`.

## Rich text

`<RichText :document="block.body" />` is the only way to render b10cks rich text. It wraps
`<B10cksRichText>`, which renders VNodes and sanitizes URLs. Do not reach for `renderRichText` with
`v-html`. That puts unsanitized CMS HTML into the DOM.

`app/components/Markdown.vue` is for markdown fields, a different field type.

## System slugs

Content slugs starting with an underscore are machinery, not pages:

- `_config` — the site-wide config entry. The default layout calls `provideB10cksConfig()` once;
  components read it with `useB10cksSiteConfig()`. Never fetch it a second time:
  `useB10cksConfig` keys its `useAsyncData` off its params, so two callers with different params
  race and one silently gets the other's language.
- `_error` — the 404 / error page content.
- `_llms` — plain-text site summary, served by `server/routes/llms.txt.ts`.
- `_drawers/<slug>` — overlay content opened via `?drawer=<slug>` instead of a route change.
  `useB10cksLink` produces those links.

## Two traps with globally registered blocks

Both come from `app/b10cks/` being global, and both fail silently.

1. **A bare tag name in `<component :is>` resolves against the block registry.**
   `<component :is="'button'">` looks up a b10cks block named `button` before it falls back to the
   HTML element, so a space with a `button` block renders the wrong thing. Resolve the tag
   yourself, or branch on it in the template.
2. **`v-html` on `<component :is>` comes back empty under SSR.** The directive is dropped when the
   component is resolved dynamically. Render through a render function instead.

## Preview

`?b10cks_vid=<version>` selects the previewed version, `?b10cks_rv=<revision>` the cached
revision. `useB10cksVersion()` normalizes the first one; `useB10cksLink` carries both across
in-app navigation.

Anything that redirects must skip when `b10cks_vid` is present, or an editor gets bounced away
from the page they are editing. Both redirect layers already do
(`server/middleware/redirects.ts`, `app/middleware/redirects.global.ts`).

If you put a CDN in front of this app, `b10cks_rv` and `b10cks_vid` must be in its cache key.
See README.md.

## SEO

Every page has one URL, one language and one h1. The rules that keep it that way:

- **One URL form.** Lowercase, no trailing slash (the root keeps its `/`), no query string.
  `server/middleware/canonical-path.ts` 301s `/About/` to `/about` in one hop.
  `useB10cksSeo` emits the canonical link and `og:url` in that form, built with `siteUrl()`
  (`shared/utils/siteUrl.ts`) like every other absolute URL, so canonical, hreflang and the
  sitemap agree. An editor's `meta.canonical` overrides it. Static hosting (`nuxt generate`)
  has no nitro at request time: do the 301s at the CDN.
- **One origin.** `resolveSiteUrl` (`server/utils/b10cks.ts`) is the site origin for robots.txt,
  the sitemap and llms.txt, and `server/plugins/site-config.ts` feeds it to nuxt-site-config,
  so schema.org `@id`s and the canonical follow it too. Never set `site.url` in
  nuxt.config.ts: it is baked in at build time, and a build without `NUXT_PUBLIC_APP_URL`
  ships `localhost` into the structured data. Override at boot with `NUXT_PUBLIC_SITE_URL`.
- **Fragments are noindex, not hidden.** A page at or below an `_` slug (`_drawers/<slug>`,
  `_config`) renders `noindex, nofollow` (`isFragmentSlug`, `shared/utils/`) and stays out of
  sitemap.xml and llms.txt. Never Disallow them in robots.txt: a crawler that may not fetch a URL
  never sees its noindex and can index it bare. Never 404 or redirect them: the live preview
  loads that route. `?drawer=` on a real page is not a fragment: no noindex, and the canonical
  drops the param.
- **Page-level noindex wins.** The catch-all page sets robots with `tagPriority: 'high'`, so it
  beats the editor's `meta.robots`. Keep it that way for any new forced noindex.
- **Languages follow `content.translations`.** `usePageAlternates(content, language)` in
  `app/pages/[...slug].vue` is the one source for hreflang (complete, reciprocal, with
  x-default), `<html lang>`, the WebPage `inLanguage` and the switcher map
  (`usePageTranslations().translations`). Only published translations count. An untranslated
  fallback renders `noindex, follow` with the default language's `lang`. Paths come from
  `buildLocalizedPath`, which assumes i18n `strategy: 'prefix'` (like the sitemap), so hreflang
  stays off unless the page's own URL is in the set. When you turn i18n on, pass the active
  locale as `language` and as `language_iso` to `useContent`. `NUXT_PUBLIC_DEFAULT_LANGUAGE`
  must match the space's default language.
- **Exactly one h1.** Every block that renders a heading takes `isFirst` and renders `<h1>`
  when it leads the page. A block that ignores it leaves the page without an h1 whenever an
  editor puts it first.
- **robots.txt on staging is `User-agent: *` + `Disallow: /` and nothing else.** A named group
  overrides `*` for that crawler, so listing the AI crawlers there would let them straight in.
- **One page list.** sitemap.xml and llms.txt both publish `fetchIndexablePages`
  (`server/utils/sitemap.ts`).

## Type generation

```sh
bun run types:b10cks   # bunx b10cks generate types $NUXT_B10CKS_SPACE_ID
```

Writes `app/b10cks/types/generated.d.ts`. Do not pass `-o`: the CLI resolves it relative to the
Nuxt `app/` rootDir, so the obvious `-o ./app/b10cks/types` lands in `app/app/b10cks/types`. The
default output path is already correct. Never edit the generated file.

## i18n

`nuxt-i18n` is scaffolded but off: the `i18n` block in nuxt.config.ts is commented out. When you
turn it on, messages come from the b10cks `translations` datasource via `i18n/fetchLocale.ts`.

Never hardcode a translation string. Create the key in b10cks and read it with `$t()`.
