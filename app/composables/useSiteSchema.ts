import type { Ref } from 'vue'

import type { B10cksConfig } from '~/b10cks/types'

/** A filled-in text field, or nothing for an empty one. */
const filled = (value: string | undefined) => value?.trim() || undefined

/**
 * Organization and WebSite schema.org nodes from `_config`. Call once, from the
 * default layout, with the config it provides: a component cannot inject what
 * it provides itself. Without a `siteName` there is nothing to describe.
 */
export function useSiteSchema(config: Ref<B10cksConfig>) {
  const { siteName, logo, email, telephone, address, zip, city, country } = config.value
  if (!filled(siteName)) {
    return
  }

  const $img = useImage()
  const postalAddress = {
    streetAddress: filled(address),
    postalCode: filled(zip),
    addressLocality: filled(city),
    addressCountry: filled(country),
  }

  useSchemaOrg([
    defineOrganization({
      name: siteName,
      logo: logo?.full_path
        ? $img(logo.full_path, { width: 512 }, { provider: 'ilum' })
        : undefined,
      email: filled(email),
      telephone: filled(telephone),
      address: Object.values(postalAddress).some(Boolean) ? postalAddress : undefined,
    }),
    defineWebSite({ name: siteName }),
  ])
}
