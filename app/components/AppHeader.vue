<script setup lang="ts">
import Logo from '~/assets/logo.svg?component'
import type { B10cksConfig } from '~/b10cks/types'

const { useB10cksConfig } = useB10cksApi()
const { config } = await useB10cksConfig<B10cksConfig>()

const showMenu = ref(false)
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const menuOverlayClasses = computed(() => ({ 'translate-x-full': !showMenu.value }))
</script>

<template>
  <header
    class="sticky top-0 z-40 overflow-x-clip"
    aria-label="site header"
  >
    <div class="content-grid">
      <div class="flex items-center">
        <NuxtLink
          to="/"
          :aria-label="`${config.siteName} - Homepage`"
          class="shrink-0"
        >
          <Logo
            :alt="config.siteName"
            :aria-label="`${config.siteName} - Logo`"
            class="h-12"
          />
        </NuxtLink>
        <div
          class="ml-auto flex items-center gap-6"
          aria-label="Main navigation"
        >
          <nav class="hidden items-center gap-6 md:flex">
            <B10cksComponent
              v-for="item in config.mainMenu"
              :key="item.id"
              :block="item"
              class="ease-butter cursor-pointer transition-colors duration-200"
            />
          </nav>
          <B10cksComponent
            v-for="action in config.actions"
            :key="action.id"
            :block="action"
          />
          <button
            class="group relative size-8 cursor-pointer md:hidden"
            type="button"
            aria-label="Toggle menu"
            aria-controls="main-menu"
            @click="toggleMenu"
          >
            <span class="sr-only">Menu</span>
            <svg
              class="group relative size-8 cursor-pointer"
              viewBox="0 0 32 32"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="8"
                width="24"
                height="2"
                rx="1"
                class="ease-macro-bounce transition-all duration-150 group-hover:translate-y-1"
              />
              <rect
                x="4"
                y="15"
                width="24"
                height="2"
                rx="1"
                class="origin-right transition-all duration-150 group-hover:scale-x-0"
              />
              <rect
                x="4"
                y="22"
                width="24"
                height="2"
                rx="1"
                class="ease-macro-bounce transition-all duration-150 group-hover:-translate-y-1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
  <div
    id="main-menu"
    :class="[
      'pointer-events-auto fixed inset-0 z-50 backdrop-blur-sm',
      'ease-embellishment transition-transform delay-0 duration-1000',
      menuOverlayClasses,
    ]"
    aria-modal="true"
    aria-label="Main menu"
    role="dialog"
  >
    <div :class="['menu theme-lighter absolute inset-0 flex flex-col']">
      <div class="pointer-events-none absolute inset-0 opacity-5" />
      <button
        class="group absolute top-6 right-4 size-8 cursor-pointer md:top-10 md:right-20"
        type="button"
        aria-label="Toggle menu"
        aria-controls="main-menu"
        @click="toggleMenu"
      >
        <span class="sr-only">Menu</span>
        <svg
          class="group ease-macro-bounce ransition-transform relative cursor-pointer duration-300 group-hover:rotate-90"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="6"
            y1="6"
            x2="26"
            y2="26"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="26"
            y1="6"
            x2="6"
            y2="26"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <div class="grid flex-1 place-items-center px-6">
        <nav class="flex flex-col items-center gap-3">
          <div
            v-for="(item, i) in config.mainMenu"
            :key="item.id"
            :class="[
              'ease-butter transition-all duration-500',
              showMenu ? 'translate-x-0 opacity-100' : 'translate-y-full opacity-0',
            ]"
            :style="{ transitionDelay: `${i * 100 + 200}ms` }"
          >
            <B10cksComponent
              :block="item"
              class="ease-butter cursor-pointer uppercase transition-colors duration-500"
              @click="toggleMenu"
            />
          </div>
        </nav>
      </div>
      <div class="flex justify-center gap-6 py-3">
        <B10cksComponent
          v-for="action in config.actions"
          :key="action.id"
          :block="action"
        />
      </div>
    </div>
  </div>
</template>
