<template>
  <header class="fixed top-0 left-0 right-0 bg-white surface-border z-5 shadow-2">
    <div class="container mx-auto p-3">
      <div class="flex justify-content-between align-items-center">
        <Button 
          icon="pi pi-arrow-left" 
          @click="goBack"
          class="p-button-text p-button-plain"
        />
        <h1 class="text-2xl font-bold m-0 text-primary">Информация о льготе</h1>
        <div style="width: 2.5rem"></div> 
      </div>
    </div>
  </header>

  <div class="surface-ground" style="padding-top: 7rem !important;">
    <div class="container mx-auto px-4 lg:px-6">
      <div v-if="loading" class="flex justify-content-center py-6">
        <ProgressSpinner />
      </div>

      <Message
        v-else-if="error"
        severity="error"
        :closable="false"
        class="mb-4"
      >
        {{ error }}
        <Button
          v-if="errorAction === 'reload'"
          label="Попробовать снова"
          class="p-button-sm ml-3"
          @click="fetchData"
        />
      </Message>

      <Card 
        v-if="benefit"
        :class="['shadow-3 overflow-hidden border-none mt-3', 
                { 'sponsored-benefit': benefit?.is_sponsored }]"
      >
        <template #header>
          <div class="flex flex-column gap-3 p-4 pb-0">
            <div class="flex align-items-center gap-2 flex-wrap">
              <Tag
                :value="getTypeLabel(benefit.type)"
                :severity="getTypeSeverity(benefit.type)"
                class="text-xs"
              />
              <Chip
                v-if="benefit.category"
                :label="benefit.category.title"
                class="text-xs"
              />
            </div>
            <h1 class="m-0 text-3xl font-bold line-height-3">{{ benefit.title }}</h1>
            <div v-if="benefit.sponsor_name" class="flex align-items-center gap-2 text-sm text-color-secondary mt-2">
              <i class="pi pi-building"></i>
              <span class="font-medium">{{ benefit.sponsor_name }}</span>
            </div>
            <p class="m-0 text-color-secondary">
              {{ benefit.description }}
            </p>
          </div>
        </template>

        <template #content>
          <div class="px-2 pt-0 flex flex-column gap-2">
            <section>
              <h3 class="text-lg font-bold mb-3">Кому доступна льгота</h3>
              <div class="flex gap-2 flex-wrap">
                <Chip
                  v-for="group in benefit.target_groups"
                  :key="group.key"
                  :label="group.title"
                  class="text-xs"
                />
              </div>
            </section>

            <section>
              <h3 class="text-lg font-bold mb-2">Где действует</h3>
              <p class="text-color-secondary m-0">
                {{ regionsText }}
              </p>
            </section>

            <section>
              <h3 class="text-lg font-bold mb-2">Как получить</h3>
              <p class="text-color-secondary m-0">
                {{ benefit.how_to_get }}
              </p>
            </section>

            <section v-if="requestMessage || requestError">
              <Message
                v-if="requestMessage"
                severity="success"
                :closable="false"
              >
                {{ requestMessage }}
              </Message>
              <Message
                v-else
                severity="error"
                :closable="false"
              >
                {{ requestError }}
              </Message>
            </section>
          </div>
        </template>

        <template #footer>
          <div class="p-4 pt-0 flex flex-column gap-2 md:flex-row md:align-items-center md:justify-content-between">
            <Button
              :label="hasRequest ? 'Уже в заявках' : 'Получить льготу'"
              :disabled="hasRequest"
              :loading="requesting"
              icon="pi pi-check-circle"
              class="p-button-lg p-button-sm p-button p-button-primary "
              @click="requestBenefit"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

export default {
  name: 'BenefitDetails',
  components: {
    Button,
    Card,
    Tag,
    Chip,
    Message,
    ProgressSpinner
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    const benefit = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const errorAction = ref(null)

    const hasRequest = ref(false)
    const requesting = ref(false)
    const requestMessage = ref('')
    const requestError = ref('')

    const regionsText = computed(() => {
      if (!benefit.value?.regions) return ''
      if (benefit.value.regions.includes('all')) {
        return 'Вся Россия'
      }
      return benefit.value.regions.join(', ')
    })

    const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'))

    const fetchBenefit = async () => {
      loading.value = true
      error.value = null
      errorAction.value = null
      try {
        const { data } = await api.get(`/benefits/${route.params.id}/`)
        benefit.value = data
      } catch (e) {
        error.value = 'Не удалось загрузить информацию о льготе'
        errorAction.value = 'reload'
      } finally {
        loading.value = false
      }
    }

    const fetchExistingRequest = async () => {
      if (!isAuthenticated()) return
      try {
        const { data } = await api.get('/users/requests/')
        hasRequest.value = Boolean(
          data.find((item) => item.benefit?.id === route.params.id)
        )
      } catch (e) {
      }
    }

    const fetchData = async () => {
      await fetchBenefit()
      await fetchExistingRequest()
    }

    const checkBenefitsLimit = async () => {
      try {
        const { data: requests } = await api.get('/users/requests/')
        const approvedCount = requests.filter(r => r.status === 'approved').length
        
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const getMaxLimit = (user) => {
          const baseLimit = 5
          if (user?.category === 'disabled') return 7
          if (user?.category === 'veteran') return 6
          if (user?.category === 'family') return 8
          return baseLimit
        }
        
        const maxLimit = getMaxLimit(user)
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

    const requestBenefit = async () => {
      if (!isAuthenticated()) {
        router.push({ name: 'Login', query: { next: route.fullPath } })
        return
      }

      const limitCheck = await checkBenefitsLimit()
      if (!limitCheck.canSubmit) {
        requestError.value = limitCheck.error
        return
      }

      requesting.value = true
      requestMessage.value = ''
      requestError.value = ''

      try {
        await api.post('/users/requests/', { benefit_id: route.params.id })
        requestMessage.value = 'Заявка отправлена. Мы уведомим вас о результате.'
        hasRequest.value = true
      } catch (e) {
        if (e.response?.status === 400) {
          const detail =
            e.response.data?.non_field_errors?.[0] ||
            e.response.data?.detail ||
            'Не удалось отправить заявку'
          requestError.value = detail
          if (detail.includes('добавлена')) {
            hasRequest.value = true
          }
        } else if (e.response?.status === 401) {
          router.push({ name: 'Login', query: { next: route.fullPath } })
        } else {
          requestError.value = 'Произошла ошибка. Попробуйте позже.'
        }
      } finally {
        requesting.value = false
      }
    }

    const goBack = () => {
      router.back()
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
        regional: 'success',
        municipal: 'warning',
        commercial: 'help'
      }[type] || 'secondary'
    }

    onMounted(fetchData)

    return {
      benefit,
      loading,
      error,
      errorAction,
      regionsText,
      hasRequest,
      requesting,
      requestMessage,
      requestError,
      fetchData,
      requestBenefit,
      goBack,
      getTypeLabel,
      getTypeSeverity
    }
  }
}
</script>

