<template>
  <Sidebar 
    v-model:visible="visible" 
    position="right"
    class="notifications-sidebar"
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <template #header>
      <div class="flex align-items-center justify-content-between w-full p-3">
        <h2 class="text-xl font-bold m-0">Уведомления</h2>
        <div class="flex align-items-center gap-2">
          <Button
            v-if="unreadCount > 0"
            label="Отметить все как прочитанные"
            icon="pi pi-check"
            class="p-button-text p-button-sm"
            @click="markAllAsRead"
          />
          <Button
            label="Очистить"
            icon="pi pi-trash"
            class="p-button-text p-button-sm p-button-danger"
            @click="clearNotifications"
          />
        </div>
      </div>
    </template>

    <div class="notifications-list">
      <div v-if="notifications.length === 0" class="text-center py-6">
        <i class="pi pi-bell text-6xl text-color-secondary mb-4"></i>
        <p class="text-color-secondary">Нет уведомлений</p>
      </div>

      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', { 'unread': !notification.read }]"
        @click="handleNotificationClick(notification)"
      >
        <div class="flex gap-3 p-3">
          <div :class="['notification-icon', `notification-${notification.type}`]">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="flex-1">
            <div class="flex align-items-center justify-content-between mb-1">
              <h3 class="text-sm font-bold m-0">{{ notification.title }}</h3>
              <Button
                icon="pi pi-times"
                class="p-button-text p-button-plain p-button-sm"
                @click.stop="removeNotification(notification.id)"
              />
            </div>
            <p class="text-sm text-color-secondary m-0 mb-2">{{ notification.message }}</p>
            <div class="flex align-items-center justify-content-between">
              <small class="text-xs text-color-secondary">
                {{ formatDate(notification.timestamp) }}
              </small>
              <Button
                v-if="notification.action"
                :label="notification.action.label"
                icon="pi pi-arrow-right"
                iconPos="right"
                class="p-button-text p-button-sm"
                @click.stop="notification.action.handler && notification.action.handler()"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
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
  name: 'NotificationsPanel',
  components: {
    Sidebar,
    Button
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

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

    loadNotifications()

    return {
      notifications,
      unreadCount,
      visible,
      getNotificationIcon,
      formatDate,
      handleNotificationClick,
      markAllAsRead,
      removeNotification,
      clearNotifications
    }
  }
}
</script>

<style scoped>
.notifications-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.notification-item {
  border-bottom: 1px solid var(--surface-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: var(--surface-hover);
}

.notification-item.unread {
  background-color: var(--primary-50);
}

.notification-icon {
  width: 2.5rem;
  height: 2.5rem;
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
</style>

