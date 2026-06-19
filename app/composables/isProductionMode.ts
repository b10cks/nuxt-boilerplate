// Shim for nuxt-schema-org devtools compatibility — it imports `isProductionMode` from `#imports`
// but Nuxt 4 no longer provides this auto-import.
export const isProductionMode = computed(() => !import.meta.dev)
