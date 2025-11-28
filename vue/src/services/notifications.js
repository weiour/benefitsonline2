import { ref } from 'vue'
import api from './api'

const notifications = ref([])
const unreadCount = ref(0)

let toast = null

export function setToast(toastInstance) {
  toast = toastInstance
}

export function addNotification(notification) {
  const notificationObj = {
    id: Date.now() + Math.random(),
    type: notification.type || 'info',
    title: notification.title || '',
    message: notification.message || '',
    timestamp: new Date(),
    read: false,
    action: notification.action || null,
    ...notification
  }
  
  notifications.value.unshift(notificationObj)
  unreadCount.value++
  
  if (toast) {
    toast.add({
      severity: notificationObj.type,
      summary: notificationObj.title,
      detail: notificationObj.message,
      life: notification.life || 5000
    })
  }
  
  saveNotifications()
  
  return notificationObj.id
}

export function markAsRead(id) {
  const notification = notifications.value.find(n => n.id === id)
  if (notification && !notification.read) {
    notification.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    saveNotifications()
    
    if (notification.serverId) {
      markAsReadOnServer(notification.serverId).catch(e => {
        console.error('Ошибка отметки уведомления как прочитанного на сервере:', e)
      })
    }
  }
}

async function markAsReadOnServer(serverId, apiInstance = api) {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return
    }

    await apiInstance.post('/users/mark_notification_read/', {
      id: serverId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  } catch (e) {
    console.error('Ошибка отметки уведомления как прочитанного на сервере:', e)
  }
}

export function markAllAsRead() {
  notifications.value.forEach(n => {
    if (!n.read) {
      n.read = true
    }
  })
  unreadCount.value = 0
  saveNotifications()
}

export function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    const notification = notifications.value[index]
    if (!notification.read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    notifications.value.splice(index, 1)
    saveNotifications()
  }
}

export function clearNotifications() {
  notifications.value = []
  unreadCount.value = 0
  saveNotifications()
}

function getCurrentUserId() {
  try {
    const user = localStorage.getItem('user')
    if (user) {
      const userObj = JSON.parse(user)
      return userObj.id || null
    }
  } catch (e) {
    console.error('Ошибка получения ID пользователя:', e)
  }
  return null
}

function saveNotifications() {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      return
    }
    
    const toSave = notifications.value.slice(0, 50)
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(toSave))
    localStorage.setItem(`unreadCount_${userId}`, unreadCount.value.toString())
  } catch (e) {
    console.error('Ошибка сохранения уведомлений:', e)
  }
}

export function clearNotificationsForUser(userId) {
  if (userId) {
    try {
      localStorage.removeItem(`notifications_${userId}`)
      localStorage.removeItem(`unreadCount_${userId}`)
      localStorage.removeItem(`serverNotificationIds_${userId}`)
    } catch (e) {
      console.error('Ошибка очистки уведомлений пользователя:', e)
    }
  }
}

export function loadNotifications() {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      notifications.value = []
      unreadCount.value = 0
      return
    }
    
    const saved = localStorage.getItem(`notifications_${userId}`)
    if (saved) {
      notifications.value = JSON.parse(saved).map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    } else {
      notifications.value = []
    }
    
    const savedCount = localStorage.getItem(`unreadCount_${userId}`)
    if (savedCount) {
      unreadCount.value = parseInt(savedCount, 10)
    } else {
      unreadCount.value = 0
    }
  } catch (e) {
    console.error('Ошибка загрузки уведомлений:', e)
    notifications.value = []
    unreadCount.value = 0
  }
}

export async function fetchNotificationsFromServer(api) {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      return
    }

    const { data: serverNotifications } = await api.get('/users/notifications/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!Array.isArray(serverNotifications)) {
      return
    }

    const savedServerIds = JSON.parse(localStorage.getItem(`serverNotificationIds_${userId}`) || '[]')
    
    const existingServerIds = notifications.value
      .filter(n => n.serverId)
      .map(n => n.serverId)
    
    const newNotifications = serverNotifications.filter(serverNotif => {
      return !savedServerIds.includes(serverNotif.id) && !existingServerIds.includes(serverNotif.id)
    })

    newNotifications.forEach(serverNotif => {
      let type = 'info'
      if (serverNotif.title.includes('одобрена') || serverNotif.title.includes('')) {
        type = 'success'
      } else if (serverNotif.title.includes('отклонена')) {
        type = 'error'
      } else if (serverNotif.title.includes('обработке')) {
        type = 'info'
      }

      addNotification({
        id: `server_${serverNotif.id}`,
        type: type,
        title: serverNotif.title,
        message: serverNotif.message,
        timestamp: new Date(serverNotif.created_at),
        read: serverNotif.is_read,
        serverId: serverNotif.id,
        action: {
          label: 'Посмотреть',
          handler: () => {
            if (window.location.pathname !== '/my-benefits') {
              window.location.href = '/my-benefits'
            }
          }
        }
      })

      savedServerIds.push(serverNotif.id)
    })

    localStorage.setItem(`serverNotificationIds_${userId}`, JSON.stringify(savedServerIds))

    serverNotifications.forEach(serverNotif => {
      if (serverNotif.is_read) {
        const localNotif = notifications.value.find(n => n.serverId === serverNotif.id)
        if (localNotif && !localNotif.read) {
          markAsRead(localNotif.id)
        }
      }
    })

  } catch (e) {
    console.error('Ошибка загрузки уведомлений с сервера:', e)
  }
}

export async function checkRequestStatusUpdates(api) {
  await fetchNotificationsFromServer(api)
  
  try {
    const { data: requests } = await api.get('/users/requests/')
    const savedStatuses = JSON.parse(localStorage.getItem('requestStatuses') || '{}')
    
    requests.forEach(request => {
      const savedStatus = savedStatuses[request.id]
      if (savedStatus && savedStatus !== request.status) {
      }
      savedStatuses[request.id] = request.status
    })
    
    localStorage.setItem('requestStatuses', JSON.stringify(savedStatuses))
  } catch (e) {
    console.error('Ошибка проверки статусов заявок:', e)
  }
}

export {
  notifications,
  unreadCount
}

