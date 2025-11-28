<template>
  <div id="app">
    <router-view />
    <Toast />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import { setToast, loadNotifications, checkRequestStatusUpdates, fetchNotificationsFromServer } from './services/notifications'
import api from './services/api'

export default {
  name: 'App',
  components: {
    Toast
  },
  setup() {
    const toast = useToast()
    
    onMounted(() => {
      setToast(toast)
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const lastUserId = localStorage.getItem('lastUserId')
      
      if (lastUserId && currentUser.id && lastUserId !== String(currentUser.id)) {
        import('./services/notifications').then(({ clearNotificationsForUser }) => {
          clearNotificationsForUser(parseInt(lastUserId))
        })
      }
      
      if (currentUser.id) {
        localStorage.setItem('lastUserId', String(currentUser.id))
      } else {
        localStorage.removeItem('lastUserId')
      }
      
      loadNotifications()
      
      const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'))
      
      if (isAuthenticated()) {
        fetchNotificationsFromServer(api)
        checkRequestStatusUpdates(api)
        setInterval(() => {
          if (isAuthenticated()) {
            fetchNotificationsFromServer(api)
            checkRequestStatusUpdates(api)
          }
        }, 2 * 60 * 1000)
      }
    })
  }
}
</script>