<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto p-3">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center">
            <Button 
              icon="pi pi-arrow-left" 
              @click="$router.back()"
              class="p-button-text p-button-plain mr-2"
            />
            <h1 class="text-2xl font-bold m-0 text-primary">Уведомления</h1>
          </div>
          <div class="flex align-items-center gap-2">
            <!-- <Button
              v-if="unreadCount > 0"
              label="Прочитать все"
              icon="pi pi-check"
              class="p-button-text p-button-sm"
              @click="markAllAsRead"
            /> -->
            <Button
              label="Очистить"
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-danger"
              @click="clearNotifications"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="container mx-auto px-4">
          <Card v-if="notifications.length === 0" class="text-center py-6">
            <template #content>
              <i class="pi pi-bell text-6xl text-color-secondary mb-4"></i>
              <p class="text-color-secondary m-0">Нет уведомлений</p>
            </template>
          </Card>

          <div v-else class="flex flex-column gap-2">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="['notification-item p-card', { 'unread': !notification.read }]"
              @click="handleNotificationClick(notification)"
            >
              <div class="p-card-content">
                <div class="flex gap-3">
                  <div :class="['notification-icon', `notification-${notification.type}`]">
                    <i :class="getNotificationIcon(notification.type)"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-content-between align-items-center mb-2">
                      <h3 class="text-sm font-bold m-0">{{ notification.title }}</h3>
                      <!-- <Button
                        icon="pi pi-times"
                        class="p-button-text p-button-plain p-button-sm"
                        @click.stop="removeNotification(notification.id)"
                      /> -->
                      <small class="text-xs text-color-secondary">
                        {{ formatDate(notification.timestamp) }}
                      </small>
                    </div>
                    <p class="text-sm text-color-secondary m-0 mb-2">{{ notification.message }}</p>
                    <div class="flex align-items-center justify-content-end">
                      <Button
                        v-if="notification.action"
                        :label="notification.action.label"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        class="p-button-text p-button-sm text-sm"
                        @click.stop="notification.action.handler && notification.action.handler()"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  computed
} from '../utils/scripts.js'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Footer from '../components/Footer.vue'
import VoiceAssistant from '../components/VoiceAssistant.vue'
import {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead as markAll,
  removeNotification as remove,
  clearNotifications as clear,
  loadNotifications
} from '../services/notifications'

export default {
  name: 'Notifications',
  components: {
    VoiceAssistant,
    Footer,
    Card,
    Button
  },
  setup() {
    const page = usePageSetup('notifications')
    const profile = useProfile()

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

    const getNotificationIcon = (type) => {
      const icons = {
        success: 'pi pi-check-circle',
        error: 'pi pi-times-circle',
        warn: 'pi pi-exclamation-triangle',
        info: 'pi pi-info-circle'
      }
      return icons[type] || 'pi pi-bell'
    }

    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      const now = new Date()
      const diff = now - d
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Только что'
      if (minutes < 60) return `${minutes} мин. назад`
      if (hours < 24) return `${hours} ч. назад`
      if (days < 7) return `${days} дн. назад`
      return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }

    const handleNotificationClick = (notification) => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
      if (notification.action?.handler) {
        notification.action.handler()
      }
    }

    const markAllAsRead = () => {
      markAll()
    }

    const removeNotification = (id) => {
      remove(id)
    }

    const clearNotifications = () => {
      if (confirm('Вы уверены, что хотите удалить все уведомления?')) {
        clear()
      }
    }

    onMounted(() => {
      loadNotifications()
    })

    return {
      ...page,
      ...profile,
      notifications,
      unreadCount,
      getNotificationIcon,
      formatDate,
      handleNotificationClick,
      markAllAsRead,
      removeNotification,
      clearNotifications,
      handleToggleProfileMenu,
      handleMenuItemClick,
      handleGoToHome,
      handleStartVoiceSearch
    }
  }
}
</script>

<style scoped>
.notification-item {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--surface-border);
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  background-color: var(--primary-50);
  border-left: 4px solid var(--p-primary-color);
}

.notification-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-success {
  background-color: var(--green-100);
  color: var(--green-700);
}

.notification-error {
  background-color: var(--red-100);
  color: var(--red-700);
}

.notification-warn {
  background-color: var(--yellow-100);
  color: var(--yellow-700);
}

.notification-info {
  background-color: var(--blue-100);
  color: var(--blue-700);
}

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
</style>