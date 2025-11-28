<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto p-3">
        <div class="flex align-items-center">
          <Button 
            icon="pi pi-arrow-left" 
            @click="$router.back()"
            class="p-button-text p-button-plain mr-2"
          />
          <h1 class="text-2xl font-bold m-0 text-primary">Настройки</h1>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="container mx-auto px-4">
          <Card>
            <template #content>
              <div class="flex flex-column gap-4">
                <div class="field">
                  <div class="flex align-items-center gap-3 mb-4 mt-1">
                    <i class="pi pi-palette text-xl"></i>
                    <label class="font-bold text-lg">Тема</label>
                  </div>
                  <div class="flex flex-column gap-2">
                    <Button 
                      label="Светлая" 
                      :class="['p-button-outlined', { 'p-button-primary': currentTheme === 'light' }]"
                      @click="setTheme('light')"
                    />
                    <Button 
                      label="Тёмная" 
                      :class="['p-button-outlined', { 'p-button-primary': currentTheme === 'dark' }]"
                      @click="setTheme('dark')"
                    />
                    <Button 
                      label="Авто" 
                      :class="['p-button-outlined', { 'p-button-primary': currentTheme === 'auto' }]"
                      @click="setTheme('auto')"
                    />
                  </div>
                </div>

                <div class="">
                  <div class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-eye text-xl"></i>
                    <label class="font-bold text-lg">Режимы доступности</label>
                  </div>
                  <div class="flex flex-column gap-3">
                    <div class="field-checkbox mb-0">
                      <Checkbox 
                        v-model="accessibilityModes.highContrast" 
                        inputId="highContrast" 
                        :binary="true" 
                        @change="updateAccessibility"
                      />
                      <label for="highContrast" class="ml-3 font-medium">Высокая контрастность</label>
                    </div>
                  </div>
                </div>

                <div class="my-2">
                  <div class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-align-center text-xl"></i>
                    <label class="font-bold text-lg">Размер текста</label>
                  </div>
                  <div class="flex flex-column gap-3">
                    <div class="flex align-items-center justify-content-between">
                      <span class="text-sm text-color-secondary">80%</span>
                      <span class="text-sm text-color-secondary">100%</span>
                      <span class="text-sm text-color-secondary">125%</span>
                      <span class="text-sm text-color-secondary">150%</span>
                    </div>
                    <Slider 
                      v-model="fontSize" 
                      :min="80" 
                      :max="150" 
                      :step="5"
                      class="w-full"
                      @change="updateFontSize"
                    />
                    <div class="flex justify-content-between">
                      <small class="text-color-secondary">Текущий размер: {{ fontSize }}%</small>
                      <Button 
                        label="Сбросить" 
                        icon="pi pi-refresh"
                        class="p-button-text p-button-sm"
                        @click="resetFontSize"
                      />
                    </div>
                  </div>
                </div>

                                <Card>
                  <template #content>
                    <div class="flex flex-column gap-3">
                      <h3 class="m-0 text-primary">Пример текста</h3>
                      <p class="m-0 text-color">
                        Это пример текста, который показывает как будет выглядеть выбранный вами размер шрифта.
                      </p>
                      <div class="flex flex-column gap-2">
                        <span class="p-tag p-component p-tag-info flex-shrink-0 text-xs w-fit">Пример тега</span>
                        <span class="p-chip p-component w-fit text-xs">Пример метки</span>
                        <Button label="Пример кнопки" class="p-button-primary mt-2" />
                      </div>
                    </div>
                  </template>
                </Card>

                <Button 
                  label="Сбросить настройки" 
                  icon="pi pi-refresh" 
                  class="p-button-outlined w-full mt-2"
                  @click="resetSettings"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </main>

    <Footer 
      :current-page="currentPage"
      :user="user"
      :profile-menu-items="profileMenuItems"
      @toggle-profile-menu="handleToggleProfileMenu"
      @menu-item-click="handleMenuItemClick"
      @go-to-home="handleGoToHome"
      @start-voice-search="handleStartVoiceSearch"
    />
  </div>
</template>

<script>
import { 
  usePageSetup,
  useProfile,
  onMounted,
  ref,
  watch
} from '../utils/scripts.js'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import { ThemeManager } from '../utils/theme'
import Footer from '../components/Footer.vue'
import VoiceAssistant from '../components/VoiceAssistant.vue'

export default {
  name: 'Settings',
  components: {
    VoiceAssistant,
    Footer,
    Card,
    Button,
    Checkbox,
    Slider
  },
  setup() {
    const page = usePageSetup('profile')
    const profile = useProfile()

    const currentTheme = ref('light')
    const fontSize = ref(100)
    const accessibilityModes = ref({
      highContrast: false,
      largeText: false
    })

    const handleToggleProfileMenu = (isVisible) => {
      page.showProfileMenu.value = isVisible
    }

    const handleMenuItemClick = (item) => {
      if (item.action) {
        item.action()
      }
    }

    const handleGoToHome = () => {
      if (page.currentPage !== 'benefits') {
        page.router.push('/')
      }
    }

    const handleStartVoiceSearch = () => {
      page.startVoiceSearch()
    }

    const setTheme = (theme) => {
      currentTheme.value = theme
      ThemeManager.setTheme(theme)
      localStorage.setItem('app-theme', theme)
    }

    const updateFontSize = () => {
      ThemeManager.setFontSize(fontSize.value)
      localStorage.setItem('app-font-size', fontSize.value.toString())
    }

    const resetFontSize = () => {
      fontSize.value = 100
      ThemeManager.setFontSize(100)
      localStorage.setItem('app-font-size', '100')
    }

    const updateAccessibility = () => {
      ThemeManager.updateAccessibility(accessibilityModes.value)
      localStorage.setItem('app-accessibility', JSON.stringify(accessibilityModes.value))
    }

    const resetSettings = () => {
      ThemeManager.reset()
      currentTheme.value = 'light'
      fontSize.value = 100
      accessibilityModes.value = {
        highContrast: false,
        largeText: false
      }
      
      localStorage.removeItem('app-theme')
      localStorage.removeItem('app-font-size')
      localStorage.removeItem('app-accessibility')
    }

    const loadSettings = () => {
      const savedTheme = localStorage.getItem('app-theme')
      if (savedTheme) {
        currentTheme.value = savedTheme
        ThemeManager.setTheme(savedTheme)
      } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        currentTheme.value = systemTheme
        ThemeManager.setTheme(systemTheme)
      }

      const savedFontSize = localStorage.getItem('app-font-size')
      if (savedFontSize) {
        fontSize.value = parseInt(savedFontSize)
        ThemeManager.setFontSize(fontSize.value)
      }

      const savedAccessibility = localStorage.getItem('app-accessibility')
      if (savedAccessibility) {
        accessibilityModes.value = JSON.parse(savedAccessibility)
        ThemeManager.updateAccessibility(accessibilityModes.value)
      }
    }

    onMounted(() => {
      loadSettings()
    })

    return {
      ...page,
      ...profile,
      currentTheme,
      fontSize,
      accessibilityModes,
      setTheme,
      updateFontSize,
      resetFontSize,
      updateAccessibility,
      resetSettings,
      handleToggleProfileMenu,
      handleMenuItemClick,
      handleGoToHome,
      handleStartVoiceSearch
    }
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--surface-ground);
  border-bottom: 1px solid var(--surface-border);
}

.app-main {
  flex: 1;
  background: var(--surface-ground);
}

.content-wrapper {
  padding-bottom: 2rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.field-checkbox label {
  cursor: pointer;
  user-select: none;
}

.p-tag, .p-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.p-tag-primary {
  background: var(--p-primary-color);
  color: white;
}

.p-chip {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
  border: 1px solid var(--p-primary-200);
}
</style>