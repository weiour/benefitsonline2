[file name]: MyBenefits.vue
[file content begin]
<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto px-4 p-3">
        <div class="flex justify-content-between align-items-center">
          <h1 class="text-2xl font-bold m-0 text-primary">Льготной кабинет</h1>
          <Button 
            label="PDF" 
            icon="pi pi-file-pdf"
            :loading="exportingPdf"
            @click="exportToPDF"
            class="p-button-outlined p-button-sm"
          />
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="container mx-auto px-4">
          <div class="flex justify-content-center py-6" v-if="loading">
            <ProgressSpinner />
          </div>

          <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
            {{ error }}
            <Button
              v-if="errorAction === 'login'"
              label="Войти"
              class="p-button-outlined p-button-sm ml-3"
              @click="goToLogin"
            />
            <Button
              v-else
              label="Попробовать снова"
              class="p-button-outlined p-button-sm ml-3"
              @click="fetchRequests"
            />
          </Message>

          <div v-else-if="requests.length === 0" class="surface-card border-round-2xl p-5 text-center shadow-2">
            <i class="pi pi-inbox text-6xl text-color-secondary mb-4"></i>
            <h3 class="text-2xl font-bold mb-2 text-primary">Здесь пока пусто</h3>
            <p class="text-color-secondary mb-4">Подберите льготы на главной странице и оформите заявку.</p>
            <Button 
              label="Подобрать льготы" 
              icon="pi pi-search" 
              class="p-button-primary" 
              @click="goToHome" 
            />
          </div>

          <div v-else class="benefits-container">
            <div class="dashboard-section surface-card border-round-2xl p-4 shadow-2 mb-4">
              <h3 class="text-lg font-bold m-0 mb-4">Сводка</h3>
              <div class="grid">
                <div class="col-6 md:col-3 text-center">
                  <div class="text-2xl font-bold text-primary">{{ requests.length }}</div>
                  <div class="text-sm text-color-secondary mt-1">Всего заявок</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-2xl font-bold text-success">{{ approvedRequests.length }}</div>
                  <div class="text-sm text-color-secondary mt-1">Одобрено</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-2xl font-bold text-warning">{{ processingRequests.length }}</div>
                  <div class="text-sm text-color-secondary mt-1">В обработке</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-2xl font-bold text-info">{{ rejectedRequests.length }}</div>
                  <div class="text-sm text-color-secondary mt-1">Отклонено</div>
                </div>
              </div>
            </div>
  
              <div class="tabs-list-compact mb-4">
                <div
                  v-for="tab in tabs"
                  :key="tab.key"
                  :class="[
                    'my-2 simple-filter-item surface-card',
                    { 'simple-filter-item-active': activeTab === tab.key }
                  ]"
                  @click="activeTab = tab.key"
                >
                  <div class="flex align-items-center justify-content-between gap-2">
                    <div class="flex align-items-center gap-2">
                      <i :class="tab.icon" class="text-sm p-2"></i>
                      <span class="text-sm font-medium">{{ tab.label }}</span>
                    </div>
                    <Badge 
                      v-if="tab.count > 0" 
                      :value="tab.count" 
                      :class="[activeTab === tab.key ? 'bg-primary text-white' : 'bg-primary text-white']"
                      class="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div class="tab-content">
                <div v-if="activeTab === 'all'" class="grid">
                  <div
                    v-for="request in requests"
                    :key="request.id"
                    class="col-12 md:col-6 lg:col-4"
                  >
                    <Card class="h-full shadow-2 hover:shadow-4 transition-all transition-duration-300 surface-border benefit-card">
                      <template #header>
                        <div class="flex justify-content-between align-items-start gap-2 p-3 pb-0">
                          <h3 class="text-lg font-bold m-0 flex-1 line-height-2">{{ request.benefit?.title }}</h3>
                          <Tag
                              :value="statusMeta[request.status]?.label || request.status"
                              :severity="statusMeta[request.status]?.severity || 'info'"
                              :icon="statusMeta[request.status]?.icon"
                              class="flex-shrink-0 text-xs"
                            />
                        </div>
                      </template>
                      
                      <template #content>
                        <div class="pt-0">
                          <p class="text-color-secondary line-height-2 mt-2 mb-3 text-sm">
                            {{ request.benefit?.description }}
                          </p>
                          <div v-if="request.benefit?.sponsor_name" class="flex align-items-center gap-2 text-sm text-color-secondary mb-2">
                            <i class="pi pi-building"></i>
                            <span class="font-medium">{{ request.benefit.sponsor_name }}</span>
                          </div>
                          <div class="flex flex-column gap-2">
                              <small class="text-color-secondary text-xs">
                              <i class="pi pi-calendar mr-1"></i>
                              Отправлена {{ formatDate(request.submitted_at) }}
                            </small>
                            <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                              <i class="pi pi-tag"></i>
                              <span>Категория: {{ request.benefit?.category?.title || '—' }}</span>
                            </div>
                            <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                              <i class="pi pi-map-marker"></i>
                              <span>Как получить: {{ request.benefit?.how_to_get }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      
                      <template #footer>
                        <div class="flex justify-content-between align-items-center p-3 pt-0">
                          <Chip
                            :label="request.benefit ? getTypeLabel(request.benefit.type) : ''"
                            :icon="request.benefit?.is_sponsored ? 'pi pi-star' : 'pi pi-flag'"
                            class="w-fit text-xs"
                          />
                          <Button
                            label="Подробнее"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            class="p-button-sm text-xs p-button p-button-primary"
                            @click="openBenefit(request.benefit?.id)"
                          />
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>

                <div v-if="activeTab === 'processing'" class="grid">
                  <div v-if="processingRequests.length === 0" class="col-12 text-center py-6">
                    <i class="pi pi-inbox text-6xl text-color-secondary mb-4"></i>
                    <h3 class="text-xl font-bold mb-2 text-primary">Нет заявок в обработке</h3>
                    <p class="text-color-secondary">Все ваши заявки уже обработаны.</p>
                  </div>
                  <div
                    v-for="request in processingRequests"
                    :key="request.id"
                    class="col-12 md:col-6 lg:col-4"
                  >
                    <Card class="h-full shadow-2 hover:shadow-4 transition-all transition-duration-300 surface-border benefit-card">
                      <template #header>
                        <div class="flex justify-content-between align-items-start gap-2 p-3 pb-0">
                          <h3 class="text-lg font-bold m-0 flex-1 line-height-2">{{ request.benefit?.title }}</h3>
                          <Tag
                            :value="statusMeta[request.status]?.label || request.status"
                            :severity="statusMeta[request.status]?.severity || 'info'"
                            :icon="statusMeta[request.status]?.icon"
                            class="flex-shrink-0 text-xs"
                          />
                        </div>
                      </template>
                      
                      <template #content>
                        <div class="pt-0">
                          <p class="text-color-secondary line-height-2 mt-2 mb-3 text-sm">
                            {{ request.benefit?.description }}
                          </p>
                          <div class="flex flex-column gap-2">
                            <small class="text-color-secondary text-xs">
                              <i class="pi pi-calendar mr-1"></i>
                              Отправлена {{ formatDate(request.submitted_at) }}
                            </small>
                            <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                              <i class="pi pi-tag"></i>
                              <span>Категория: {{ request.benefit?.category?.title || '—' }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      
                      <template #footer>
                        <div class="flex justify-content-end p-3 pt-0">
                          <Button 
                            label="Подробнее" 
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            class="p-button-outlined p-button-sm text-xs"
                            @click="openBenefit(request.benefit?.id)"
                          />
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>

                <div v-if="activeTab === 'archive'" class="grid">
                  <div v-if="rejectedRequests.length === 0" class="col-12 text-center py-6">
                    <i class="pi pi-archive text-6xl text-color-secondary mb-4"></i>
                    <h3 class="text-xl font-bold mb-2 text-primary">Архив пуст</h3>
                    <p class="text-color-secondary">Здесь будут отображаться отклоненные заявки.</p>
                  </div>
                  <div
                    v-for="request in rejectedRequests"
                    :key="request.id"
                    class="col-12 md:col-6 lg:col-4"
                  >
                    <Card class="h-full shadow-2 hover:shadow-4 transition-all transition-duration-300 surface-border benefit-card">
                      <template #header>
                        <div class="flex justify-content-between align-items-start gap-2 p-3 pb-0">
                          <h3 class="text-lg font-bold m-0 flex-1 line-height-2">{{ request.benefit?.title }}</h3>
                          <Tag
                            :value="statusMeta[request.status]?.label || request.status"
                            :severity="statusMeta[request.status]?.severity || 'danger'"
                            :icon="statusMeta[request.status]?.icon"
                            class="flex-shrink-0 text-xs"
                          />
                        </div>
                      </template>
                      
                      <template #content>
                        <div class="pt-0">
                          <p class="text-color-secondary line-height-2 mt-2 mb-3 text-sm">
                            {{ request.benefit?.description }}
                          </p>
                          <div v-if="request.comment" class="mb-3 p-2 bg-red-50 border-round text-xs">
                            <strong>Причина отклонения:</strong> {{ request.comment }}
                          </div>
                          <div class="flex flex-column gap-2">
                            <small class="text-color-secondary text-xs">
                              <i class="pi pi-calendar mr-1"></i>
                              Отправлена {{ formatDate(request.submitted_at) }}
                            </small>
                            <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                              <i class="pi pi-tag"></i>
                              <span>Категория: {{ request.benefit?.category?.title || '—' }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                      
                      <template #footer>
                        <div class="flex justify-content-end p-3 pt-0">
                          <Button 
                            label="Подробнее" 
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            class="p-button-outlined p-button-sm text-xs"
                            @click="openBenefit(request.benefit?.id)"
                          />
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </main>

    <Footer 
      :user="user"
      :show-profile-menu="showProfileMenu"
      @update:show-profile-menu="handleToggleProfileMenu"
      @menu-item-click="handleMenuItemClick"
      @go-to-home="handleGoToHome"
      @start-voice-search="handleStartVoiceSearch"
    />

    <Dialog 
      v-model:visible="showBenefitModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="benefit-details-modal"
      :style="{ width: '95vw', maxWidth: '500px', background: 'transparent', boxShadow: 'none' }"
      :showHeader="false"
      :contentStyle="{ padding: '0', margin: '0', background: 'transparent', border: 'none', boxShadow: 'none' }"
      :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }"
    >
      <template #closeicon>
        <i class="pi pi-times"></i>
      </template>

      <div v-if="selectedBenefitLoading" class="flex justify-content-center py-6">
        <ProgressSpinner />
      </div>

      <Message
        v-else-if="selectedBenefitError"
        severity="error"
        :closable="false"
        class="mb-4 m-3"
      >
        {{ selectedBenefitError }}
        <Button
          v-if="selectedBenefitErrorAction === 'reload'"
          label="Попробовать снова"
          class="p-button-sm ml-3"
          @click="fetchSelectedBenefit"
        />
      </Message>

      <div v-else-if="selectedBenefit" class="relative">
        <Button 
          icon="pi pi-times" 
          @click="closeBenefitModal"
          class="p-button-text p-button-plain absolute top-0 right-0 m-3 z-5 border-circle shadow-2"
          style="width: 2.5rem; height: 2.5rem;"
        />

        <Card class="shadow-3 overflow-hidden border-none mt-3">
          <template #header>
            <div class="flex flex-column gap-3 p-4 pb-0">
              <div class="flex align-items-center gap-2 flex-wrap">
                <Tag
                  :value="getTypeLabel(selectedBenefit.type)"
                  :severity="getTypeSeverity(selectedBenefit.type)"
                  class="text-xs"
                />
                <Chip
                  v-if="selectedBenefit.category"
                  :label="selectedBenefit.category.title"
                  class="text-xs"
                />
              </div>
              <h1 class="m-0 text-2xl font-bold line-height-3">{{ selectedBenefit.title }}</h1>
              <div v-if="selectedBenefit.sponsor_name" class="flex align-items-center gap-2 text-sm text-color-secondary mt-2">
                <i class="pi pi-building"></i>
                <span class="font-medium">{{ selectedBenefit.sponsor_name }}</span>
              </div>
              <p class="m-0 text-color-secondary">
                {{ selectedBenefit.description }}
              </p>
            </div>
          </template>

          <template #content>
            <div class="px-2 pt-0 flex flex-column gap-4">
              <section>
                <h3 class="text-lg font-bold mb-3">Кому доступна льгота</h3>
                <div class="flex gap-2 flex-wrap">
                  <Chip
                    v-for="group in selectedBenefit.target_groups"
                    :key="group.key"
                    :label="group.title"
                    class="text-xs"
                  />
                </div>
              </section>

              <section>
                <h3 class="text-lg font-bold mb-2">Где действует</h3>
                <p class="text-color-secondary m-0">
                  {{ getSelectedBenefitRegionsText }}
                </p>
              </section>

              <section>
                <h3 class="text-lg font-bold mb-2">Как получить</h3>
                <p class="text-color-secondary m-0">
                  {{ selectedBenefit.how_to_get }}
                </p>
              </section>
            </div>
          </template>

          <template #footer>
            <div class="p-4 flex flex-column gap-2">
              <div class="flex gap-2">
                <Button
                  v-if="selectedBenefit?.is_sponsored"
                  label="Заявка отправлена"
                  :disabled="true"
                  icon="pi pi-check"
                  class="p-button-lg flex-1 p-button-success"
                />
                
                <Button
                  v-else-if="selectedBenefit?.external_url"
                  label="Перейти на сайт"
                  icon="pi pi-external-link"
                  class="p-button-lg flex-1 p-button-outlined"
                  @click="handleExternalBenefit"
                />
                
                <Button
                  v-else
                  label="Подробнее"
                  icon="pi pi-info-circle"
                  class="p-button-lg flex-1 p-button-outlined"
                  @click="openBenefit(selectedBenefit.id)"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </Dialog>
  </div>
</template>

<script>
import VoiceAssistant from '../components/VoiceAssistant.vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import Footer from '../components/Footer.vue'
import pdfExportService from '../services/pdfExportPdfmake'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Avatar from 'primevue/avatar'
import Sidebar from 'primevue/sidebar'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'

export default {
  name: 'MyBenefits',
  components: {
    VoiceAssistant,
    Footer,
    Button,
    Card,
    Chip,
    Tag,
    Message,
    ProgressSpinner,
    Avatar,
    Sidebar,
    Badge,
    Dialog
  },
  setup() {
    const router = useRouter()
    const requests = ref([])
    const loading = ref(false)
    const error = ref(null)
    const errorAction = ref(null)
    const activeTab = ref('all')
    const showBenefitModal = ref(false)
    const selectedBenefit = ref(null)
    const selectedBenefitLoading = ref(false)
    const selectedBenefitError = ref(null)
    const selectedBenefitErrorAction = ref(null)
    const user = ref(JSON.parse(localStorage.getItem('user')))
    const currentPage = ref('my-benefits')
    const showProfileMenu = ref(false)
    
    const handleShowProfileMenuUpdate = (value) => {
      showProfileMenu.value = value
    }

    const handleMenuItemClick = (item) => {
      if (item.action) {
        item.action()
      }
    }

    const statusMeta = {
      new: { label: 'Отправлена', severity: 'info', icon: 'pi pi-paper-plane' },
      processing: { label: 'В обработке', severity: 'warning', icon: 'pi pi-clock' },
      approved: { label: 'Одобрена', severity: 'success', icon: 'pi pi-check' },
      rejected: { label: 'Отклонена', severity: 'danger', icon: 'pi pi-times' }
    }

    const approvedRequests = computed(() => 
      requests.value.filter(req => req.status === 'approved')
    )
    
    const processingRequests = computed(() => 
      requests.value.filter(req => req.status === 'processing' || req.status === 'new')
    )
    
    const rejectedRequests = computed(() => 
      requests.value.filter(req => req.status === 'rejected')
    )

    const tabs = computed(() => [
      { 
        key: 'all', 
        label: 'Все заявки', 
        icon: 'pi pi-list',
        count: requests.value.length
      },
      { 
        key: 'processing', 
        label: 'В обработке', 
        icon: 'pi pi-clock',
        count: processingRequests.value.length
      },
      { 
        key: 'archive', 
        label: 'Архив', 
        icon: 'pi pi-file-excel',
        count: rejectedRequests.value.length
      }
    ])

    const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'))

    const fetchRequests = async () => {
      if (!isAuthenticated()) {
        error.value = 'Авторизуйтесь, чтобы увидеть свои льготы.'
        errorAction.value = 'login'
        requests.value = []
        return
      }

      loading.value = true
      error.value = null
      errorAction.value = null

      try {
        const { data } = await api.get('/users/requests/')
        requests.value = data
      } catch (e) {
        error.value = 'Не удалось загрузить список льгот'
      } finally {
        loading.value = false
      }
    }

    const getTargetGroupsText = (groups) => {
      if (!groups || !Array.isArray(groups)) return '—'
      return groups.map(g => g.title || g).join(', ')
    }

    const getTypeLabel = (type) => {
      return {
        federal: 'Федеральная',
        regional: 'Региональная',
        municipal: 'Муниципальная',
        commercial: 'Коммерческая'
      }[type] || type
    }

    const getTypeSeverity = (type) => {
      return {
        federal: 'info',
        regional: 'warning', 
        municipal: 'success',
        commercial: 'help'
      }[type] || 'info'
    }

    const formatDate = (value) => {
      if (!value) return ''
      const date = new Date(value)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const openBenefitModal = async (benefit) => {
      if (!benefit?.id) return
      
      selectedBenefit.value = null
      selectedBenefitLoading.value = true
      selectedBenefitError.value = null
      selectedBenefitErrorAction.value = null
      showBenefitModal.value = true

      try {
        if (benefit.description && benefit.target_groups && benefit.how_to_get) {
          selectedBenefit.value = benefit
        } else {
          const { data } = await api.get(`/benefits/${benefit.id}/`)
          selectedBenefit.value = data
        }
      } catch (e) {
        selectedBenefitError.value = 'Не удалось загрузить информацию о льготе'
        selectedBenefitErrorAction.value = 'reload'
      } finally {
        selectedBenefitLoading.value = false
      }
    }

    const closeBenefitModal = () => {
      showBenefitModal.value = false
      selectedBenefit.value = null
      selectedBenefitError.value = null
    }

    const fetchSelectedBenefit = async () => {
      if (!selectedBenefit.value?.id) return
      
      selectedBenefitLoading.value = true
      selectedBenefitError.value = null
      
      try {
        const { data } = await api.get(`/benefits/${selectedBenefit.value.id}/`)
        selectedBenefit.value = data
      } catch (e) {
        selectedBenefitError.value = 'Не удалось загрузить информацию о льготе'
      } finally {
        selectedBenefitLoading.value = false
      }
    }

    const getSelectedBenefitRegionsText = computed(() => {
      if (!selectedBenefit.value?.regions) return 'По всей России'
      
      const regions = selectedBenefit.value.regions
      if (regions.length === 0) return 'По всей России'
      if (regions.length === 1) return regions[0].name
      if (regions.length <= 3) return regions.map(r => r.name).join(', ')
      return `${regions[0].name} и еще ${regions.length - 1} регионов`
    })

    const handleExternalBenefit = () => {
      if (selectedBenefit.value?.external_url) {
        window.open(selectedBenefit.value.external_url, '_blank')
      }
    }

    const startVoiceSearch = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('voice-assistant-activate'))
      }
    }

    const syncUser = () => {
      user.value = JSON.parse(localStorage.getItem('user'))
    }

    const login = () => {
      router.push('/login')
      showProfileMenu.value = false
    }

    const logout = () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      user.value = null
      showProfileMenu.value = false
      currentPage.value = 'benefits'
      router.push('/')
    }

    const setPage = (page) => {
      showProfileMenu.value = false
      currentPage.value = page
      if (page !== 'benefits') router.push('/' + page)
    }

    const toggleProfileMenu = () => {
      showProfileMenu.value = !showProfileMenu.value
    }

    const getUserInitials = () => {
      if (!user.value?.full_name) return '?'
      return user.value.full_name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }

    const getUserCategory = () => {
      if (!user.value) return ''
      const categories = {
        pensioner: 'Пенсионер',
        disabled: 'Человек с инвалидностью',
        low_income: 'Малоимущий',
        veteran: 'Ветеран',
        family: 'Многодетная семья',
        student: 'Студент'
      }
      return categories[user.value.category] || user.value.category
    }

    const handleStorage = (event) => {
      if (['user', 'accessToken', 'refreshToken'].includes(event.key)) {
        syncUser()
      }
    }
    
    const handleVoiceSearch = (event) => {
      const query = event.detail?.query ?? ''
    }

    const profileMenuItems = computed(() => {
      if (!user.value) {
        return [
          { label: 'Войти', icon: 'pi pi-lock', action: login }
        ]
      } else {
        return [
          { label: 'Моя страница', icon: 'pi pi-user', action: () => setPage('profile') },
          { label: 'Мои льготы', icon: 'pi pi-list', action: () => setPage('my-benefits') },
          { label: 'Настройки', icon: 'pi pi-cog', action: () => setPage('settings') },
          { label: 'Выйти', icon: 'pi pi-sign-out', action: logout, danger: true }
        ]
      }
    })

    const profileSheetHeight = computed(() => {
      const baseHeight = user.value ? 25 : 15
      const itemHeight = 11
      return Math.min((profileMenuItems.value.length * itemHeight), 80)
    })

    const lockBodyScroll = () => {
      document.body.classList.add('sidebar-open')
    }

    const unlockBodyScroll = () => {
      document.body.classList.remove('sidebar-open')
    }

    const touchStartY = ref(0)
    const touchCurrentY = ref(0)

    const handleTouchStart = (event) => {
      touchStartY.value = event.touches[0].clientY
      touchCurrentY.value = event.touches[0].clientY
    }

    const handleTouchMove = (event) => {
      if (!showProfileMenu.value) return
      const touchY = event.touches[0].clientY
      if (touchY - touchStartY.value > 30) {
        showProfileMenu.value = false
      }
    }

    const handleTouchEnd = () => {
    }

    const goToHome = () => router.push('/')
    const goToLogin = () => router.push('/login')
    const openBenefit = (id) => {
      if (!id) {
        console.warn('openBenefit: id is missing', id)
        return
      }
      try {
        router.push({ name: 'BenefitDetails', params: { id: String(id) } })
      } catch (error) {
        console.error('Error navigating to benefit:', error)
      }
    }

    const exportingPdf = ref(false)

    const exportToPDF = async () => {
      exportingPdf.value = true
      
      try {
        const userBenefits = requests.value
        
        if (!userBenefits || userBenefits.length === 0) {
          alert('У вас нет заявок на льготы для экспорта')
          return
        }
        
        const fileName = `льготы_${user.value.full_name || 'пользователь'}_${new Date().toISOString().split('T')[0]}.pdf`
        
        await pdfExportService.exportBenefitsToPDF(
          user.value,
          userBenefits,
          fileName
        )
        
        console.log('PDF успешно экспортирован')
        
      } catch (error) {
        console.error('Ошибка экспорта:', error)
        alert('Не удалось экспортировать данные в PDF: ' + error.message)
      } finally {
        exportingPdf.value = false
      }
    }

    const handleBenefitRequestCreated = () => {
      fetchRequests()
    }

    onMounted(async () => {
      await fetchRequests()
      syncUser()
      window.addEventListener('storage', handleStorage)
      window.addEventListener('voice-search', handleVoiceSearch)
      window.addEventListener('benefit-request-created', handleBenefitRequestCreated)
    })

    watch(showProfileMenu, (visible) => {
      if (visible) {
        lockBodyScroll()
      } else {
        unlockBodyScroll()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('voice-search', handleVoiceSearch)
      window.removeEventListener('benefit-request-created', handleBenefitRequestCreated)
      unlockBodyScroll()
    })

    return {
      router,
      handleShowProfileMenuUpdate,
      handleMenuItemClick,
      requests,
      approvedRequests,
      processingRequests,
      rejectedRequests,
      tabs,
      activeTab,
      statusMeta,
      loading,
      error,
      errorAction,
      user,
      currentPage,
      showProfileMenu,
      profileSheetHeight,
      profileMenuItems,
      showBenefitModal,
      selectedBenefit,
      selectedBenefitLoading,
      selectedBenefitError,
      selectedBenefitErrorAction,
      getSelectedBenefitRegionsText,
      goToHome,
      goToLogin,
      openBenefit,
      openBenefitModal,
      closeBenefitModal,
      fetchSelectedBenefit,
      handleExternalBenefit,
      fetchRequests,
      startVoiceSearch,
      syncUser,
      login,
      logout,
      setPage,
      toggleProfileMenu,
      getUserInitials,
      getUserCategory,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleVoiceSearch,
      getTypeLabel,
      getTypeSeverity,
      formatDate,
      exportingPdf,
      exportToPDF,
      getTargetGroupsText,
    }
  }
}
</script>

<style scoped>

</style>
[file content end]