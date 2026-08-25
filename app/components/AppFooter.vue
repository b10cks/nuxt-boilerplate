<script lang="ts" setup>
import Logo from '~/assets/logo.svg?component'

const config = useB10cksSiteConfig()

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer
    v-editable="config"
    class="content-grid py-20"
    role="contentinfo"
    aria-label="Site footer"
  >
    <div class="flex flex-col gap-8 lg:flex-row">
      <div class="flex flex-col gap-y-6">
        <NuxtLink
          :to="'/'"
          :aria-label="`${config?.siteName} - To Home`"
          class="shrink-0"
        >
          <Logo
            class="h-12"
            aria-hidden="true"
          />
        </NuxtLink>

        <Markdown
          v-if="config?.footerText"
          v-editable="config"
          v-editable-field="{ id: config?.id, field: 'footerText' }"
          :content="config.footerText"
          class="prose prose-invert"
        />
      </div>
      <div
        v-editable-field="{ id: config?.id, field: 'footerMenu' }"
        class="flex flex-col gap-8 sm:flex-row md:gap-16 lg:ml-auto"
      >
        <B10cksComponent
          v-for="block in config?.footerMenu"
          :key="block.id"
          :block="block"
        />
      </div>
    </div>
    <div class="mt-4 flex flex-col items-start md:flex-row">
      <Markdown
        v-if="config?.copyright"
        v-editable-field="{ id: config?.id, field: 'copyright' }"
        class="order-2 w-full pt-2 text-center md:order-1 md:text-left"
        :content="config.copyright.replace('{year}', String(year))"
      />
    </div>
  </footer>
</template>
