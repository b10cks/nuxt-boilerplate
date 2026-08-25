import type { InjectionKey, Ref } from 'vue'

import type { B10cksConfig } from '~/b10cks/types'

/** Site-wide b10cks config, provided once by `app/layouts/default.vue`. */
export const siteConfigKey: InjectionKey<Ref<B10cksConfig>> = Symbol('siteConfig')
