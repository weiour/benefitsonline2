import { ref, computed, onMounted, onUnmounted, onActivated, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { regionOptions as regions } from '../data/regions'

export function usePageSetup(pageName = 'benefits') {
  const router = useRouter()
  
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const currentPage = ref(pageName)
  const showProfileMenu = ref(false)
  const searchQuery = ref('')
  const loading = ref(false)
  const error = ref(null)
  const profileMenuItems = computed(() => getProfileMenuItems(user.value, router, showProfileMenu))
  
  const profileSheetHeight = computed(() => {
    const baseHeight = user.value ? 25 : 15
    const itemHeight = 11
    return Math.min((profileMenuItems.value.length * itemHeight), 80)
  })

  const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'))
  const startVoiceSearch = () => window.dispatchEvent(new Event('voice-assistant-activate'))
  const syncUser = () => user.value = JSON.parse(localStorage.getItem('user'))
  const toggleProfileMenu = () => showProfileMenu.value = !showProfileMenu.value
  const goToHome = () => router.push('/')

   const logout = async () => {
    // Очищаем уведомления перед выходом
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (currentUser.id) {
      const { clearNotificationsForUser } = await import('../services/notifications')
      clearNotificationsForUser(currentUser.id)
    }
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    user.value = null
    showProfileMenu.value = false
    router.push('/')
  }

  const touchHandlers = createTouchHandlers(showProfileMenu)

  watch(showProfileMenu, (visible) => {
    if (visible) lockBodyScroll()
    else unlockBodyScroll()
  })

  const handleVoiceSearch = (event) => searchQuery.value = event.detail?.query ?? ''
  const handleStorage = (event) => {
    if (['user', 'accessToken', 'refreshToken'].includes(event.key)) syncUser()
  }

  onMounted(() => {
    window.addEventListener('voice-search', handleVoiceSearch)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('user-updated', syncUser)
  })

  onUnmounted(() => {
    unlockBodyScroll()
    window.removeEventListener('voice-search', handleVoiceSearch)
    window.removeEventListener('storage', handleStorage)
  })

  return {
    user,
    currentPage,
    showProfileMenu,
    searchQuery,
    loading,
    error,
    profileMenuItems,
    profileSheetHeight,
    isAuthenticated,
    startVoiceSearch,
    syncUser,
    toggleProfileMenu,
    goToHome,
    logout,
    ...touchHandlers,
    handleVoiceSearch,
    handleStorage,
    router
  }
}

export function useBenefits(searchQuery) {
  const benefits = ref([])
  const selectedTypeFilter = ref('')
  const selectedRegionFilter = ref(null) // Фильтр по региону
  const selectedCategoryFilters = ref([])
  const availableForMe = ref(false)
  const notReceived = ref(false)
  const benefitsLoading = ref(false)
  const benefitsError = ref(null)
  const availableBenefitsIds = ref([]) // ID льгот, доступных пользователю
  const userRequests = ref([]) // Заявки пользователя

  const typeFilters = [
    { label: 'Все', value: '' },
    { label: 'Федеральные', value: 'federal' },
    { label: 'Региональные', value: 'regional' },
    { label: 'Муниципальные', value: 'municipal' },
    { label: 'Спецпредложения', value: 'commercial' }
  ]

  const categoryFilters = [
    { label: 'Транспорт', value: 'transport' },
    { label: 'Медицина', value: 'medicine' },
    { label: 'Коммунальные услуги', value: 'utilities' },
    { label: 'Жильё и ипотека', value: 'housing' },
    { label: 'Образование', value: 'education' },
    { label: 'Детские программы', value: 'childcare' },
    { label: 'Культура и досуг', value: 'culture' },
    { label: 'Спорт', value: 'sport' },
    { label: 'Налоги', value: 'tax' },
    { label: 'Связь и интернет', value: 'communication' },
    { label: 'Занятость', value: 'employment' },
    { label: 'Соцподдержка', value: 'social_support' }
  ]

  const filteredBenefits = computed(() => {
    if (!benefits.value || !Array.isArray(benefits.value)) return []
    
    return benefits.value.filter(benefit => {
      const searchText = searchQuery?.value || ''
      const matchesSearch = !searchText || 
        (benefit.title && benefit.title.toLowerCase().includes(searchText.toLowerCase())) ||
        (benefit.description && benefit.description.toLowerCase().includes(searchText.toLowerCase()))

      const matchesType = !selectedTypeFilter.value || benefit.type === selectedTypeFilter.value
      
      const matchesCategory = selectedCategoryFilters.value.length === 0 || 
        (benefit.category && selectedCategoryFilters.value.includes(benefit.category.key))

      // Фильтр по региону
      const matchesRegion = !selectedRegionFilter.value || (() => {
        const benefitRegions = benefit.regions || []
        // Если льгота для всех регионов
        if (benefitRegions.includes('all') || benefitRegions.includes('ALL')) {
          return true
        }
        // Проверяем, есть ли выбранный регион в списке регионов льготы
        return benefitRegions.includes(selectedRegionFilter.value) || 
               benefitRegions.some(r => String(r) === String(selectedRegionFilter.value))
      })()

      // Фильтр "Доступны мне"
      const matchesAvailableForMe = !availableForMe.value || 
        availableBenefitsIds.value.includes(benefit.id)

      // Фильтр "Неполученные" - льготы, на которые пользователь еще не подавал заявку
      const matchesNotReceived = !notReceived.value || 
        !userRequests.value.some(request => request.benefit?.id === benefit.id || request.benefit === benefit.id)

      return matchesSearch && matchesType && matchesCategory && matchesRegion && matchesAvailableForMe && matchesNotReceived
    })
  })

  const sponsoredBenefits = computed(() => {
    return filteredBenefits.value.filter(b => b.is_sponsored === true)
  })

  const regularBenefits = computed(() => {
    return filteredBenefits.value.filter(b => !b.is_sponsored || b.is_sponsored === false)
  })

  const sortedBenefits = computed(() => {
    const sponsored = sponsoredBenefits.value
    const regular = regularBenefits.value
    return [...sponsored, ...regular]
  })

  const fetchBenefits = async () => {
    benefitsLoading.value = true
    benefitsError.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      
      const response = await api.get('/benefits/', config)
      benefits.value = response.data || []
      
      // Загружаем доступные льготы и заявки, если пользователь авторизован
      if (token) {
        await Promise.all([
          fetchAvailableBenefits(),
          fetchUserRequests()
        ])
      }
    } catch (e) {
      console.error(e)
      // Если ошибка 401 - это нормально для неавторизованных пользователей
      if (e.response?.status === 401) {
        benefitsError.value = null
        benefits.value = [] // или можно загружать базовые льготы
      } else {
        benefitsError.value = 'Не удалось загрузить данные о льготах'
      }
      benefits.value = []
    } finally {
      benefitsLoading.value = false
    }
  }

  const fetchAvailableBenefits = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        availableBenefitsIds.value = []
        return
      }
      
      const response = await api.get('/users/benefits/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Сохраняем только ID доступных льгот для быстрой проверки
      availableBenefitsIds.value = (response.data || []).map(b => b.id)
    } catch (e) {
      console.error('Ошибка загрузки доступных льгот:', e)
      availableBenefitsIds.value = []
    }
  }

  const fetchUserRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        userRequests.value = []
        return
      }
      
      const response = await api.get('/users/requests/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      userRequests.value = response.data || []
    } catch (e) {
      console.error('Ошибка загрузки заявок пользователя:', e)
      userRequests.value = []
    }
  }

  const toggleTypeFilter = (filter) => {
    selectedTypeFilter.value = selectedTypeFilter.value === filter ? '' : filter
  }

  const toggleCategoryFilter = (filter) => {
    const index = selectedCategoryFilters.value.indexOf(filter)
    if (index > -1) {
      selectedCategoryFilters.value.splice(index, 1)
    } else {
      selectedCategoryFilters.value.push(filter)
    }
  }

  const clearAllFilters = () => {
    selectedTypeFilter.value = ''
    selectedRegionFilter.value = null
    selectedCategoryFilters.value = []
    availableForMe.value = false
    notReceived.value = false
  }

  const clearTypeFilter = () => {
    selectedTypeFilter.value = ''
    // Очищаем регион при сбросе типа фильтра
    selectedRegionFilter.value = null
  }

  const removeCategoryFilter = (filter) => {
    const index = selectedCategoryFilters.value.indexOf(filter)
    if (index > -1) selectedCategoryFilters.value.splice(index, 1)
  }

  // Метод для получения дней до истечения
  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null
    const expireDate = new Date(dateString)
    const today = new Date()
    return Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24))
  }

  // Обновим метод formatDiscount для лучшей обработки
  const formatDiscount = (discount) => {
    if (typeof discount === 'number') {
      return Math.max(0, discount) // гарантируем неотрицательное значение
    }
    if (typeof discount === 'object' && discount !== null) {
      return discount.percent || discount.value || Object.values(discount)[0] || 0
    }
    // Пытаемся извлечь число из строки
    const match = String(discount).match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  // Метод для переключения элементов в массиве фильтров
  const toggleArrayFilter = (array, value) => {
    const index = array.indexOf(value)
    if (index > -1) {
      array.splice(index, 1)
    } else {
      array.push(value)
    }
  }

  // Метод для удаления элемента из массива
  const removeFromArray = (array, value) => {
    const index = array.indexOf(value)
    if (index > -1) {
      array.splice(index, 1)
    }
  }

  // Метод для получения текста типа партнера
  const getPartnerTypeText = (type) => {
    const partnerTypes = [
      { value: 'retail', label: 'Розничная торговля' },
      { value: 'services', label: 'Услуги' },
      { value: 'cafe', label: 'Кафе и рестораны' },
      { value: 'health', label: 'Здоровье и красота' },
      { value: 'education', label: 'Образование' }
    ]
    const option = partnerTypes.find(opt => opt.value === type)
    return option ? option.label : type
  }

  // Метод для получения текста срока действия
  const getExpireFilterText = (days) => {
    const expireOptions = [
      { value: 1, label: '1 день' },
      { value: 3, label: '3 дня' },
      { value: 7, label: '1 неделя' },
      { value: 14, label: '2 недели' },
      { value: 30, label: '1 месяц' }
    ]
    const option = expireOptions.find(opt => opt.value === days)
    return option ? `Истекает: ${option.label}` : `Истекает: ${days} дн.`
  }

  // Метод для получения ближайшего значения из массива
  const getClosestValue = (value, valuesArray) => {
    if (!valuesArray || valuesArray.length === 0) return value
    return valuesArray.reduce((prev, curr) => {
      return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
    })
  }

  return {
    benefits,
    selectedTypeFilter,
    selectedRegionFilter,
    selectedCategoryFilters,
    availableForMe,
    notReceived,
    benefitsLoading,
    benefitsError,
    typeFilters,
    categoryFilters,
    filteredBenefits,
    sponsoredBenefits,
    regularBenefits,
    fetchBenefits,
    fetchAvailableBenefits,
    fetchUserRequests,
    toggleTypeFilter,
    toggleCategoryFilter,
    clearAllFilters,
    clearTypeFilter,
    removeCategoryFilter,
    toggleArrayFilter,
    getDaysUntilExpiry,
    formatDiscount,
    removeFromArray,
    getPartnerTypeText,
    getExpireFilterText,
    getClosestValue,

    getTypeLabel: (type) => ({ federal: 'Федеральная', regional: 'Региональная', municipal: 'Муниципальная', commercial: 'Спецпредложение' }[type] || type),
    getCategoryName: (category) => category?.title || 'Неизвестно',
    getTargetGroups: (groups) => groups?.map(g => g.title).join(', ') || '',

    getFilterLabel: (value) => {
      const f = categoryFilters.find(f => f.value === value) || typeFilters.find(f => f.value === value)
      return f ? f.label : ''
    },

    getTypeSeverity: (type) => ({ 
      federal: 'info', 
      regional: 'success', 
      municipal: 'warning', 
      commercial: 'commercial'
    }[type] || 'secondary'),
  }
}

export function useBenefitModals(router) {
  const showBenefitModal = ref(false)
  const selectedBenefit = ref(null)
  const selectedBenefitLoading = ref(false)
  const selectedBenefitError = ref(null)
  const selectedBenefitHasRequest = ref(false)
  const selectedBenefitRequesting = ref(false)
  const selectedBenefitRequestMessage = ref('')
  const selectedBenefitRequestError = ref('')
  const showSnilsModal = ref(false)
  const snilsInput = ref('')
  const snilsError = ref('')
  const savingSnils = ref(false)

  const openBenefit = async (benefit) => {
    showBenefitModal.value = true
    selectedBenefit.value = benefit
    selectedBenefitHasRequest.value = false
    selectedBenefitRequestMessage.value = ''
    selectedBenefitRequestError.value = ''
    showSnilsModal.value = false
    snilsInput.value = ''
    snilsError.value = ''
    
    try {
      const token = localStorage.getItem('accessToken')
      if (token && benefit?.id) {
        const { data: requests } = await api.get('/users/requests/')
        const existingRequest = requests.find(r => {
          const benefitId = r.benefit?.id || r.benefit
          return String(benefitId) === String(benefit.id)
        })
        if (existingRequest) {
          selectedBenefitHasRequest.value = true
          selectedBenefitRequestMessage.value = 'Заявка уже отправлена'
        }
      }
    } catch (e) {
      console.warn('Не удалось проверить существующие заявки:', e)
    }
  }

  const closeBenefitModal = () => {
    showBenefitModal.value = false
    selectedBenefit.value = null
    selectedBenefitHasRequest.value = false
  }

  const normalizeSnils = (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '')
  }

  const validateSnils = (snils) => {
    const normalized = normalizeSnils(snils)
    if (!normalized) {
      return 'Введите СНИЛС'
    }
    if (normalized.length !== 11) {
      return 'СНИЛС должен содержать 11 цифр'
    }
    return null
  }

  const saveSnils = async () => {
    const error = validateSnils(snilsInput.value)
    if (error) {
      snilsError.value = error
      return
    }

    snilsError.value = ''
    savingSnils.value = true

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        snilsError.value = 'Необходимо войти в систему'
        savingSnils.value = false
        return
      }

      const normalizedSnils = normalizeSnils(snilsInput.value)
      
      const { data: updatedUser } = await api.patch('/users/profile/', {
        snils: normalizedSnils
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.snils = normalizedSnils
        localStorage.setItem('user', JSON.stringify(user))
      }

      showSnilsModal.value = false
      snilsInput.value = ''
      
      await submitBenefitRequest()
    } catch (error) {
      console.error('Ошибка при сохранении СНИЛС:', error)
      if (error.response?.status === 400) {
        snilsError.value = error.response.data?.snils?.[0] || 'Неверный формат СНИЛС'
      } else {
        snilsError.value = 'Произошла ошибка при сохранении СНИЛС'
      }
    } finally {
      savingSnils.value = false
    }
  }

  const checkBenefitsLimit = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return { canSubmit: true, error: null }
      
      const { data: requests } = await api.get('/users/requests/')
      const approvedCount = requests.filter(r => r.status === 'approved').length
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const maxLimit = getMaxBenefitsLimitForUser(user)
      
      if (approvedCount >= maxLimit) {
        return {
          canSubmit: false,
          error: `Вы достигли максимального лимита льгот (${maxLimit}). Нельзя получить больше льгот одновременно.`
        }
      }
      
      return { canSubmit: true, error: null }
    } catch (error) {
      console.warn('Ошибка при проверке лимита:', error)
      return { canSubmit: true, error: null }
    }
  }
  
  const getMaxBenefitsLimitForUser = (user) => {
    const baseLimit = 5
    
    if (user?.category === 'disabled') {
      return 7
    } else if (user?.category === 'veteran') {
      return 6
    } else if (user?.category === 'family') {
      return 8
    }
    
    return baseLimit
  }

  const submitBenefitRequest = async () => {
    if (!selectedBenefit.value) return
    
    const limitCheck = await checkBenefitsLimit()
    if (!limitCheck.canSubmit) {
      selectedBenefitRequestError.value = limitCheck.error
      return
    }
    
    selectedBenefitRequesting.value = true
    selectedBenefitRequestError.value = ''
    selectedBenefitRequestMessage.value = ''
    
    try {
      await api.post('/users/requests/', { 
        benefit_id: selectedBenefit.value.id 
      })
      
      selectedBenefitRequestMessage.value = 'Заявка отправлена успешно'
      selectedBenefitHasRequest.value = true
      
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('benefit-request-created', {
          detail: { benefitId: selectedBenefit.value.id }
        }))
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error)
      
      if (error.response?.status === 400) {
        const detail = error.response.data?.non_field_errors?.[0] || 
                      error.response.data?.detail || 
                      'Не удалось отправить заявку'
        selectedBenefitRequestError.value = detail
        
        if (detail.includes('добавлена') || detail.includes('уже')) {
          selectedBenefitHasRequest.value = true
        }
      } else if (error.response?.status === 401) {
        selectedBenefitRequestError.value = 'Необходимо войти в систему'
        router.push({ name: 'Login', query: { next: router.currentRoute.value.fullPath } })
      } else {
        selectedBenefitRequestError.value = 'Произошла ошибка. Попробуйте позже.'
      }
    } finally {
      selectedBenefitRequesting.value = false
    }
  }

  const requestSelectedBenefit = async () => {
    if (!selectedBenefit.value) return
    
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      selectedBenefitRequestError.value = 'Необходимо войти в систему'
      return
    }
    
    const user = JSON.parse(userStr)
    if (!user.snils || !user.snils.trim()) {
      showSnilsModal.value = true
      snilsInput.value = ''
      snilsError.value = ''
      return
    }
    
    await submitBenefitRequest()
  }

  const handleExternalBenefit = () => {
    if (selectedBenefit.value?.external_url) {
      window.open(selectedBenefit.value.external_url, '_blank')
    }
    closeBenefitModal()
  }

  const getGosuslugiUrl = (benefit) => {
    if (benefit?.gosuslugi_url) {
      return benefit.gosuslugi_url
    }
    const searchQuery = encodeURIComponent(benefit?.title || 'льгота')
    return `https://www.gosuslugi.ru/10052/1/form?query=${searchQuery}`
  }

  const getMfcUrl = (benefit) => {
    if (benefit?.mfc_url) {
      return benefit.mfc_url
    }
    return 'https://mfc.ru/'
  }

  const openGosuslugi = () => {
    if (selectedBenefit.value) {
      const url = getGosuslugiUrl(selectedBenefit.value)
      window.open(url, '_blank')
    }
  }

  const openMfc = () => {
    if (selectedBenefit.value) {
      const url = getMfcUrl(selectedBenefit.value)
      window.open(url, '_blank')
    }
  }

  const getSelectedBenefitRegionsText = computed(() => {
    if (!selectedBenefit.value?.regions) return ''
    return selectedBenefit.value.regions.includes('all') ? 'Вся Россия' : selectedBenefit.value.regions.join(', ')
  })

  const showReportModal = ref(false)
  const reportedBenefit = ref(null)
  const reportSubmitting = ref(false)

  const openReportModal = (benefit) => {
    reportedBenefit.value = benefit
    showReportModal.value = true
  }

  const closeReportModal = () => {
    showReportModal.value = false
    reportedBenefit.value = null
    reportSubmitting.value = false
  }

  const submitReport = async (reason) => {
    if (!reportedBenefit.value) return
    
    reportSubmitting.value = true
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // имитация задержки
      
      console.log('Жалоба отправлена:', {
        benefitId: reportedBenefit.value.id,
        benefitTitle: reportedBenefit.value.title,
        reason: reason,
        timestamp: new Date().toISOString()
      })
      
      alert('Спасибо! Ваша жалоба отправлена. Мы проверим информацию в ближайшее время.')
      
      closeReportModal()
    } catch (error) {
      console.error('Ошибка при отправке жалобы:', error)
      alert('Произошла ошибка при отправке жалобы. Попробуйте позже.')
    } finally {
      reportSubmitting.value = false
    }
  }

  return {
    showBenefitModal,
    selectedBenefit,
    selectedBenefitLoading,
    selectedBenefitError,
    selectedBenefitHasRequest,
    selectedBenefitRequesting,
    selectedBenefitRequestMessage,
    selectedBenefitRequestError,
    showSnilsModal,
    snilsInput,
    snilsError,
    savingSnils,
    openBenefit,
    closeBenefitModal,
    requestSelectedBenefit,
    saveSnils,
    handleExternalBenefit,
    getSelectedBenefitRegionsText,
    getGosuslugiUrl,
    getMfcUrl,
    openGosuslugi,
    openMfc,
    showReportModal,
    reportedBenefit,
    reportSubmitting,
    openReportModal,
    closeReportModal,
    submitReport
  }
}

function getProfileMenuItems(user, router, showProfileMenu) {
  const login = () => {
    router.push('/login')
    if (showProfileMenu?.value !== undefined) showProfileMenu.value = false
  }

  const logout = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (currentUser.id) {
      const { clearNotificationsForUser } = await import('../services/notifications')
      clearNotificationsForUser(currentUser.id)
    }
    
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    if (showProfileMenu?.value !== undefined) showProfileMenu.value = false
    router.push('/')
  }

  const setPage = (page, showProfileMenu) => {
    if (showProfileMenu?.value !== undefined) showProfileMenu.value = false
    if (page !== 'benefits') router.push('/' + page)
  }

  if (!user) {
    return [{ label: 'Войти', icon: 'pi pi-lock', action: login }]
  } else {
    return [
      { label: 'Моя страница', icon: 'pi pi-user', action: () => setPage('profile', showProfileMenu) },
      { label: 'Мои льготы', icon: 'pi pi-list', action: () => setPage('my-benefits', showProfileMenu) },
      { label: 'Настройки', icon: 'pi pi-cog', action: () => setPage('settings', showProfileMenu) },
      { label: 'Выйти', icon: 'pi pi-sign-out', action: logout, danger: true }
    ]
  }
}

function createTouchHandlers(showProfileMenuRef) {
  const handleTouchStart = (event) => {
  }

  const handleTouchMove = (event) => {
    if (!showProfileMenuRef?.value) return
  }

  const handleTouchEnd = () => {
  }

  return { handleTouchStart, handleTouchMove, handleTouchEnd }
}

function lockBodyScroll(className = 'sidebar-open') {
  document.body.classList.add(className)
}

function unlockBodyScroll(className = 'sidebar-open') {
  document.body.classList.remove(className)
}

export { 
  ref, 
  computed, 
  onMounted, 
  onUnmounted, 
  onActivated, 
  reactive, 
  watch, 
  useRouter 
}

export function useProfile() {
  const router = useRouter()
  
  const stats = ref({ active: 0, expiring: 0, recommended: 0 })
  const recommendedBenefits = ref([])
  const showEditModal = ref(false)
  const saving = ref(false)
  const fileInput = ref(null)
  const showInterestSelectModal = ref(false)
  const showInterestSelectModalInEdit = ref(false)

  const mapRegionLabel = (value) => {
    if (!regions || !value) return 'Регион не указан'
    const region = regions.find(r => r.value === value)
    return region ? region.label : value
  }

  const getUserCategory = (user) => {
  const category = user?.value?.category
  if (!category) return 'Категория не указана'
  
  const categoryMap = {
    pensioner: 'Пенсионер',
    disabled: 'Инвалид 1 группы',
    disabled_2: 'Инвалид 2 группы',
    disabled_3: 'Инвалид 3 группы', 
    veteran: 'Ветеран',
    family: 'Многодетная семья',
    student: 'Студент',
    low_income: 'Малоимущий',
    child: 'Ребенок'
  }
  
  return categoryMap[category] || category
  }

  const getUserInitials = (user) => {
    if (!user?.value?.full_name) return '?'
    return user.value.full_name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const editForm = reactive({
    full_name: '',
    category: '',
    region: '',
    email: '',
    phone: '',
    avatar: '',
    interests: []
  })

  const editFormErrors = reactive({
    full_name: '',
    category: '',
    region: '',
    email: '',
    phone: ''
  })

  const availableCategories = [
    { label: 'Пенсионер', value: 'pensioner' },
    { label: 'Инвалид 1 группы', value: 'disabled' },
    { label: 'Инвалид 2 группы', value: 'disabled_2' },
    { label: 'Инвалид 3 группы', value: 'disabled_3' },
    { label: 'Ветеран', value: 'veteran' },
    { label: 'Многодетная семья', value: 'family' },
    { label: 'Студент', value: 'student' },
    { label: 'Малоимущий', value: 'low_income' },
    { label: 'Ребенок', value: 'child' }
  ]

  const availableRegions = computed(() => {
    return regions ? regions.map(region => ({
      label: region.label,
      value: region.value
    })) : []
  })

  const availableInterests = [
    { value: 'medicine', label: 'Лекарства', icon: 'pi pi-heart' },
    { value: 'transport', label: 'Транспорт', icon: 'pi pi-car' },
    { value: 'housing', label: 'ЖКХ', icon: 'pi pi-home' },
    { value: 'education', label: 'Образование', icon: 'pi pi-book' },
    { value: 'tax', label: 'Налоги', icon: 'pi pi-dollar' },
    { value: 'culture', label: 'Культура', icon: 'pi pi-ticket' }
  ]

  const loadProfileData = async (user, loading, error) => {
    loading.value = true
    error.value = null
    
    try {
      await loadUserData(user)
      await loadUserStats()
      await loadRecommendedBenefits()
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e)
      error.value = 'Не удалось загрузить данные профиля'
    } finally {
      loading.value = false
    }
  }

  const loadUserData = async (user) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        
        const { data: userData } = await api.get('/users/me/', config)
        console.log('Данные с сервера:', userData)
        
        const localUser = localStorage.getItem('user')
        let savedInterests = []
        let savedPhone = null
        
        if (localUser) {
          const parsedLocalUser = JSON.parse(localUser)
          savedInterests = parsedLocalUser.interests || []
          savedPhone = parsedLocalUser.phone || null
        }

        user.value = {
          ...userData,
          interests: savedInterests,
          phone: savedPhone
        }

        localStorage.setItem('user', JSON.stringify(user.value))
      } else {
        const localUser = localStorage.getItem('user')
        if (localUser) {
          user.value = JSON.parse(localUser)
        } else {
          user.value = {
            full_name: '',
            category: '',
            region: '',
            email: '',
            phone: '',
            avatar: '',
            interests: [],
            verified: false
          }
        }
      }
    } catch (error) {
      console.warn('Ошибка загрузки данных пользователя:', error)
      const localUser = localStorage.getItem('user')
      if (localUser) {
        user.value = JSON.parse(localUser)
      }
    }
  }

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        stats.value = { active: 0, expiring: 0, recommended: 0 }
        return
      }

      const { data: requests } = await api.get('/users/requests/')
      const expiring = requests.filter(r => r.status === 'new' || r.status === 'processing').length
      const active = requests.filter(r => r.status === 'approved').length
      const recommended = requests.filter(r => r.status === 'rejected').length

      console.log('Загружена статистика льгот:', { active, expiring, recommended, totalRequests: requests.length })
      console.log('Одобренные заявки:', requests.filter(r => r.status === 'approved'))

      stats.value = { active, expiring, recommended }
    } catch (error) {
      console.warn('Не удалось загрузить статистику:', error)
      stats.value = { active: 0, expiring: 0, recommended: 0 }
    }
  }

  const loadRecommendedBenefits = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    
    const { data: benefits } = await api.get('/benefits/', config)
    recommendedBenefits.value = benefits.slice(0, 5)
  } catch (error) {
    console.warn('Не удалось загрузить рекомендованные льготы:', error)
    recommendedBenefits.value = []
  }
}

  const openEditModal = (user) => {
    console.log(user.value)
    
    if (user && user.value) {
      editForm.full_name = user.value.full_name || ''
      editForm.category = user.value.category || ''
      editForm.region = user.value.region || ''
      editForm.email = user.value.email || ''
      editForm.phone = user.value.phone || ''
      editForm.avatar = user.value.avatar || ''
      editForm.interests = user.value.interests ? [...user.value.interests] : []
    }

    console.log('Данные в форме:', editForm)

    Object.keys(editFormErrors).forEach(key => {
      editFormErrors[key] = ''
    })
    
    showEditModal.value = true
  }

  const closeEditModal = () => {
    showEditModal.value = false
  }

  const openFileInput = () => {
    fileInput.value?.click()
  }

  const handleFileUpload = async (event, user) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        editForm.avatar = e.target.result
        user.value.avatar = e.target.result
        
        const updatedUser = { ...user.value }
        sessionStorage.setItem('user', JSON.stringify(updatedUser))
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error)
      alert('Не удалось загрузить аватар. Попробуйте еще раз.')
    } finally {
      event.target.value = ''
    }
  }

  const saveProfile = async (user, loading, error) => {
    let hasErrors = false
    
    if (!editForm.full_name?.trim()) {
      editFormErrors.full_name = 'Введите ФИО'
      hasErrors = true
    } else {
      editFormErrors.full_name = ''
    }
    
    if (!editForm.category) {
      editFormErrors.category = 'Выберите категорию'
      hasErrors = true
    } else {
      editFormErrors.category = ''
    }
    
    if (!editForm.region) {
      editFormErrors.region = 'Выберите регион'
      hasErrors = true
    } else {
      editFormErrors.region = ''
    }

    if (!editForm.phone?.trim()) {
      editFormErrors.phone = 'Введите номер телефона'
      hasErrors = true
    } else {
      editFormErrors.phone = ''
    }
    
    if (hasErrors) {
      console.log('Ошибки валидации:', editFormErrors)
      return
    }

    saving.value = true
    
    try {
      console.log('Начинаем сохранение профиля...')
      
      const token = localStorage.getItem('accessToken')
      
      const formData = new FormData()
      formData.append('full_name', editForm.full_name.trim())
      formData.append('category', editForm.category)
      formData.append('region', editForm.region)
      if (editForm.email?.trim()) {
        formData.append('email', editForm.email.trim())
      }
      
      if (editForm.avatar) {
        if (editForm.avatar.startsWith('data:')) {
          try {
            const base64Data = editForm.avatar.split(',')[1]
            const mimeType = editForm.avatar.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: mimeType })
            
            const extension = mimeType.split('/')[1] || 'jpg'
            const fileName = `avatar.${extension}`
            
            const file = new File([blob], fileName, { type: mimeType })
            formData.append('avatar', file)
            console.log('Аватар добавлен в FormData:', fileName, mimeType)
          } catch (e) {
            console.error('Ошибка конвертации аватара из data URL:', e)
            try {
              const response = await fetch(editForm.avatar)
              const blob = await response.blob()
              const file = new File([blob], 'avatar.jpg', { type: blob.type })
              formData.append('avatar', file)
            } catch (fetchError) {
              console.error('Альтернативный способ также не сработал:', fetchError)
            }
          }
        } else if (typeof editForm.avatar === 'string' && !editForm.avatar.startsWith('http')) {
          try {
            const response = await fetch(editForm.avatar)
            const blob = await response.blob()
            const file = new File([blob], 'avatar.jpg', { type: blob.type })
            formData.append('avatar', file)
          } catch (e) {
            console.warn('Не удалось загрузить аватар из пути:', e)
          }
        }
      }
      
      const updatedUser = {
        ...user.value,
        full_name: editForm.full_name.trim(),
        category: editForm.category,
        region: editForm.region,
        email: editForm.email?.trim() || '',
        phone: editForm.phone.trim(),
        avatar: editForm.avatar || '',
        interests: editForm.interests || []
      }

      if (token) {
        try {
          const { data: serverUserData } = await api.patch('/users/profile/', formData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          console.log('Данные успешно сохранены на сервере:', serverUserData)
          
          updatedUser.id = serverUserData.id
          updatedUser.username = serverUserData.username
          updatedUser.phone_verified = serverUserData.phone_verified
          updatedUser.email_verified = serverUserData.email_verified
          updatedUser.verified = serverUserData.verified
          if (serverUserData.avatar) {
            updatedUser.avatar = serverUserData.avatar
          }
        } catch (apiError) {
          console.error('Ошибка сохранения на сервере:', apiError)
        }
      }

      user.value = updatedUser
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      console.log('Данные успешно сохранены в localStorage')

      showEditModal.value = false
      
      alert('Профиль успешно сохранен!')
      
    } catch (error) {
      console.error('Критическая ошибка сохранения профиля:', error)
      alert('Произошла ошибка при сохранении профиля')
    } finally {
      saving.value = false
    }
  }

  const getAvailableInterests = () => availableInterests
  const getAvailableInterestsInEdit = () => availableInterests

  const selectInterest = (interestValue, user) => {
    if (!user.value.interests) {
      user.value.interests = []
    }
    
    if (user.value.interests.includes(interestValue)) {
      user.value.interests = user.value.interests.filter(i => i !== interestValue)
    } else {
      user.value.interests.push(interestValue)
    }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const selectInterestInEdit = (interestValue) => {
    if (!editForm.interests) {
      editForm.interests = []
    }
    if (editForm.interests.includes(interestValue)) {
      editForm.interests = editForm.interests.filter(i => i !== interestValue)
    } else {
      editForm.interests.push(interestValue)
    }
  }

  const addInterestInModal = () => {
    showInterestSelectModalInEdit.value = true
  }

  const removeInterestInModal = (interest) => {
    if (confirm('Удалить категорию из интересов?')) {
      editForm.interests = editForm.interests.filter(i => i !== interest)
    }
  }

  const addInterest = () => {
    showInterestSelectModal.value = true
  }

  const removeInterest = (interest, user) => {
    if (confirm('Удалить категорию из интересов?')) {
      user.value.interests = user.value.interests.filter(i => i !== interest)
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  const getEditFormInitials = () => {
    if (!editForm.full_name) return '?'
    return editForm.full_name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const getRegionLabel = (value) => mapRegionLabel(value)

  const getVerificationStatus = (user) => {
    if (user.value?.verified) {
      return 'Ваш статус подтверждён'
    } else {
      return 'Подтвердите статус для доступа ко всем льготам'
    }
  }

  const getInterestLabel = (interestValue) => {
    const interest = availableInterests.find(i => i.value === interestValue)
    return interest ? interest.label : interestValue
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      medicine: 'pi pi-heart',
      transport: 'pi pi-car',
      housing: 'pi pi-home',
      education: 'pi pi-book',
      tax: 'pi pi-dollar',
      culture: 'pi pi-ticket',
      federal: 'pi pi-flag',
      regional: 'pi pi-map',
      municipal: 'pi pi-building',
      commercial: 'pi pi-shopping-cart'
    }
    return iconMap[category?.key] || category?.icon || 'pi pi-star'
  }

  const goToSettings = () => router.push('/settings')
  const goToMyBenefits = () => router.push('/my-benefits')
  const goToRecommended = () => router.push('/recommended')
  const showBenefitDetails = (benefit) => {
    alert(`Льгота: ${benefit.title}\nОписание: ${benefit.description || 'Нет описания'}`)
  }

  const goToApplications = () => {
  }

  const goToDocuments = () => {
  }

  const findNewBenefits = () => {
  }

  const syncWithServer = async (user) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Вы не авторизованы. Пожалуйста, войдите в систему.')
      return
    }

    saving.value = true
    
    try {
      const formData = new FormData()
      const userData = user?.value || JSON.parse(localStorage.getItem('user') || '{}')
      
      if (userData.full_name) formData.append('full_name', userData.full_name)
      if (userData.category) formData.append('category', userData.category)
      if (userData.region) formData.append('region', userData.region)
      if (userData.email) formData.append('email', userData.email)
      
      if (userData.avatar && userData.avatar.startsWith('data:')) {
        try {
          const base64Data = userData.avatar.split(',')[1]
          const mimeType = userData.avatar.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: mimeType })
          
          const extension = mimeType.split('/')[1] || 'jpg'
          const fileName = `avatar.${extension}`
          
          const file = new File([blob], fileName, { type: mimeType })
          formData.append('avatar', file)
        } catch (e) {
          console.error('Ошибка конвертации аватара:', e)
          try {
            const response = await fetch(userData.avatar)
            const blob = await response.blob()
            const file = new File([blob], 'avatar.jpg', { type: blob.type })
            formData.append('avatar', file)
          } catch (fetchError) {
            console.error('Альтернативный способ также не сработал:', fetchError)
          }
        }
      } else if (userData.avatar && typeof userData.avatar === 'string' && !userData.avatar.startsWith('http')) {
        try {
          const response = await fetch(userData.avatar)
          const blob = await response.blob()
          const file = new File([blob], 'avatar.jpg', { type: blob.type })
          formData.append('avatar', file)
        } catch (e) {
          console.warn('Не удалось загрузить аватар из пути:', e)
        }
      }
      
      const { data: serverUserData } = await api.patch('/users/profile/', formData)
      
      if (user && user.value) {
        user.value = {
          ...userData,
          ...serverUserData,
          interests: userData.interests || [],
          phone: userData.phone || ''
        }
        localStorage.setItem('user', JSON.stringify(user.value))
      } else {
        const updatedUser = {
          ...userData,
          ...serverUserData,
          interests: userData.interests || [],
          phone: userData.phone || ''
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      alert('Профиль успешно синхронизирован с сервером!')
    } catch (error) {
      console.error('Ошибка синхронизации:', error)
      alert('Не удалось синхронизировать профиль с сервером. Проверьте подключение к интернету.')
    } finally {
      saving.value = false
    }
  }

  const normalizePhoneForStorage = (phone) => {
    if (!phone) return ''
    if (phone.includes('(') && phone.includes(')') && phone.includes('-')) {
      return phone
    }
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `+7 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9,11)}`
    }
    return phone
  }

  return {
    stats,
    recommendedBenefits,
    showEditModal,
    editForm,
    editFormErrors,
    availableCategories,
    availableRegions,
    saving,
    fileInput,
    showInterestSelectModal,
    showInterestSelectModalInEdit,
    getUserCategory,
    getUserInitials,
    loadProfileData,
    openEditModal,
    closeEditModal,
    openFileInput,
    handleFileUpload,
    saveProfile,
    getAvailableInterests,
    getAvailableInterestsInEdit,
    selectInterest,
    selectInterestInEdit,
    addInterestInModal,
    removeInterestInModal,
    addInterest,
    removeInterest,
    getEditFormInitials,
    getRegionLabel,
    getVerificationStatus,
    getInterestLabel,
    getCategoryIcon,
    goToSettings,
    goToMyBenefits,
    goToRecommended,
    showBenefitDetails,
    goToApplications,
    goToDocuments,
    findNewBenefits,
    syncWithServer
  }
}

export const phoneUtils = {
  formatPhone(phone) {
    if (!phone) return ''
    if (phone.includes('(') && phone.includes(')')) {
      return phone
    }
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 11) {
      return `+7 (${clean.slice(1,4)}) ${clean.slice(4,7)}-${clean.slice(7,9)}-${clean.slice(9,11)}`
    }
    return phone
  },
  
  getCleanPhone(phone) {
    return phone ? phone.replace(/\D/g, '') : ''
  },
  
  isValidPhone(phone) {
    if (!phone) return false
    return !phone.includes('_') && /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phone)
  }
}