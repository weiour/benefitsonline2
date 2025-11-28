<template>
  <div>
    <footer class="app-footer">
      <div class="flex justify-content-around align-items-center py-2 max-w-30rem mx-auto">
        <Button 
          :class="['p-button-text footer-btn', { 'footer-btn-active': currentPage === 'home' }]" 
          @click="goToHome"
          class="flex flex-column align-items-center gap-1 w-4rem"
        >
          <i class="pi pi-home"></i>
          <!-- <span class="text-xs">Главная</span> -->
        </Button>
        <Button 
          :class="['p-button-text footer-btn', { 'footer-btn-active': currentPage === 'search' }]" 
          @click="goToSearch"
          class="flex flex-column align-items-center gap-1 w-4rem"
        >
          <i class="pi pi-search"></i>
          <!-- <span class="text-xs">Поиск</span> -->
        </Button>
        <Button 
          :class="['p-button-text footer-btn', { 'footer-btn-active': currentPage === 'voice-assistant' }]" 
          @click="startVoiceSearch"
          class="flex flex-column align-items-center gap-1 w-4rem p-button p-button-primary p-button-outlined p-button-sm"
        >
          <i class="pi pi-microphone"></i>
          <!-- <span class="text-xs">Помощник</span> -->
        </Button>
        <Button 
          :class="['p-button-text footer-btn', { 'footer-btn-active': currentPage === 'notifications' }]" 
          @click="goToNotifications"
          class="flex flex-column align-items-center gap-1 w-4rem relative"
        >
          <i class="pi pi-bell"></i>
          <Badge 
            v-if="unreadCount > 0" 
            :value="unreadCount > 99 ? '99+' : unreadCount" 
            class="absolute top-0"
            style="right: 15px;"
            severity="danger"
          />
          <!-- <span class="text-xs">Уведомления</span> -->
        </Button>
        <Button 
          :class="['p-button-text footer-btn', { 'footer-btn-active': currentPage === 'profile' }]" 
          @click="toggleProfileMenu"
          class="flex flex-column align-items-center gap-1 w-4rem"
        >
          <i class="pi pi-bars"></i>
          <!-- <span class="text-xs">{{ user ? 'Меню' : 'Войти' }}</span> -->
        </Button>
      </div>
    </footer>

    <Sidebar 
      v-model:visible="internalShowProfileMenu" 
      position="bottom"
      class="border-round-top-3xl profile-sidebar"
      :showHeader="false"
      :dismissable="true"
      :modal="true"
      :blockScroll="true"
      :style="{ height: 'auto', maxHeight: '80vh' }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @update:visible="handleSidebarVisibilityChange"
    >
      <div class="sheet-handle-wrapper">
        <div class="sheet-handle"></div>
      </div>
      
      <div class="flex flex-column gap-3 mt-2">
        <Button 
          v-for="item in profileMenuItems"
          :key="item.label"
          @click="handleMenuItemClick(item)"
          :class="['p-button-text p-3 w-full', { 'p-button-danger': item.danger }]"
          style="display: flex; justify-content: center; align-items: center;"
        >
          <i :class="item.icon" class="mr-2"></i>
          <span>{{ item.label }}</span>
        </Button>
      </div>
    </Sidebar>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Badge from 'primevue/badge'
import { unreadCount } from '../services/notifications'

export default {
  name: 'Footer',
  components: {
    Button,
    Sidebar,
    Badge,
  },
  props: {
    user: {
      type: Object,
      default: null
    },
    showProfileMenu: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:showProfileMenu', 'menu-item-click', 'go-to-home', 'start-voice-search'],
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    
    const internalShowProfileMenu = ref(props.showProfileMenu)

    const currentPage = computed(() => {
      const path = route.path
      if (path === '/') return 'home'
      if (path === '/search' || path.startsWith('/search/')) return 'search'
      if (path === '/notifications') return 'notifications'
      if (path === '/profile' || path === '/settings' || path === '/my-benefits' || path === '/favorites') return 'profile'
      if (path === '/voice-assistant') return 'voice-assistant'
      return 'home'
    })

    watch(() => props.showProfileMenu, (newValue) => {
      internalShowProfileMenu.value = newValue
    })

    watch(internalShowProfileMenu, (newValue) => {
      emit('update:showProfileMenu', newValue)
    })

    const startVoiceSearch = () => {
      emit('start-voice-search')
    }

    const goToHome = () => {
      emit('go-to-home')
    }

    const goToSearch = () => {
      if (currentPage.value !== 'search') {
        router.push('/search')
      }
    }

    const showNotificationsPanel = ref(false)

    const login = () => {
      router.push('/login')
      internalShowProfileMenu.value = false
    }

    const logout = async () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (currentUser.id) {
        const { clearNotificationsForUser } = await import('../services/notifications')
        clearNotificationsForUser(currentUser.id)
      }
      
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      internalShowProfileMenu.value = false
      router.push('/')
    }

    const setPage = (page) => {
      internalShowProfileMenu.value = false
      if (page !== 'home') router.push('/' + page)
    }

    const toggleProfileMenu = () => {
      internalShowProfileMenu.value = !internalShowProfileMenu.value
    }

    const touchStartY = ref(0)
    const touchCurrentY = ref(0)

    const handleTouchStart = (event) => {
      touchStartY.value = event.touches[0].clientY
      touchCurrentY.value = event.touches[0].clientY
    }

    const handleTouchMove = (event) => {
      if (!internalShowProfileMenu.value) return
      const touchY = event.touches[0].clientY
      if (touchY - touchStartY.value > 30) {
        internalShowProfileMenu.value = false
      }
    }

    const handleTouchEnd = () => {
    }

    const handleSidebarVisibilityChange = (visible) => {
      internalShowProfileMenu.value = visible
    }

    const handleMenuItemClick = (item) => {
      internalShowProfileMenu.value = false
      emit('menu-item-click', item)
    }

    const goToNotifications = () => {
      if (currentPage.value !== 'notifications') {
        router.push('/notifications')
      }
    }

    const profileMenuItems = computed(() => {
      if (!props.user) {
        return [
          { label: 'Войти', icon: 'pi pi-lock', action: login }
        ]
      } else {
        return [
          { label: 'Моя страница', icon: 'pi pi-user', action: () => setPage('profile') },
          { label: 'Мои льготы', icon: 'pi pi-list', action: () => setPage('my-benefits') },
          { label: 'Избранное', icon: 'pi pi-heart', action: () => setPage('favorites') },
          { label: 'Настройки', icon: 'pi pi-cog', action: () => setPage('settings') },
          { label: 'Выйти', icon: 'pi pi-sign-out', action: logout, danger: true }
        ]
      }
    })

    const lockBodyScroll = () => {
      document.body.classList.add('sidebar-open')
    }

    const unlockBodyScroll = () => {
      document.body.classList.remove('sidebar-open')
    }

    watch(internalShowProfileMenu, (visible) => {
      if (visible) {
        lockBodyScroll()
      } else {
        unlockBodyScroll()
      }
    })

    return {
      currentPage,
      internalShowProfileMenu,
      profileMenuItems,
      startVoiceSearch,
      toggleProfileMenu,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleSidebarVisibilityChange,
      goToHome,
      goToSearch,
      goToNotifications,
      handleMenuItemClick,
      showNotificationsPanel,
      unreadCount,
    }
  }
}
</script>

<style scoped>
.app-footer {
  background: var(--surface-ground);
  border-top: 1px solid var(--surface-border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.footer-btn {
  border-radius: 12px;
  padding: 0.5rem;
  transition: all 0.3s ease;
  background: transparent !important;
}

.footer-btn-active {
  background: var(--p-primary-100) !important;
}

.footer-btn-active i {
  color: var(--p-primary-600) !important;
}

[data-theme="dark"] .footer-btn-active {
  background: var(--p-primary-800) !important;
}

[data-theme="dark"] .footer-btn-active i {
  color: var(--p-primary-200) !important;
}

html[data-accessibility~="highContrast"] .footer-btn-active {
  background: var(--surface-border) !important;
  border: 2px solid var(--surface-border) !important;
}

html[data-accessibility~="highContrast"] .footer-btn-active i {
  color: var(--surface-ground) !important;
}

html[data-accessibility~="highContrast"][data-theme="dark"] .footer-btn-active {
  background: var(--text-color) !important;
  border: 2px solid var(--text-color) !important;
}

html[data-accessibility~="highContrast"][data-theme="dark"] .footer-btn-active i {
  color: var(--surface-ground) !important;
}

.sheet-handle-wrapper {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background-color: var(--surface-400);
  border-radius: 2px;
}

@media (max-width: 768px) {
  .app-footer {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.profile-sidebar {
  max-height: 90vh;
}

.profile-sidebar .p-sidebar-header {
  display: none;
}

.profile-sidebar .p-sidebar-content {
  padding-top: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
  overscroll-behavior: contain;
}

body.sidebar-open {
  overflow: hidden;
  touch-action: none;
}
</style>