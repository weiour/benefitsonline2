<template>
  <div class="home-page">
    <VoiceAssistant />
    <div class="app-layout">
      <header class="app-header">
        <div class="container mx-auto p-4">
          <div class="flex align-items-center">
            <h1 class="text-2xl font-bold m-0 text-primary">Льготы Онлайн</h1>
          </div>
        </div>
      </header>

      <main class="app-main">
        <div class="container mx-auto px-4">
          <!-- <div v-if="debugInfo" class="mb-4 p-3 surface-card border-round">
            <p>предложений: {{ partnerOffers.length }}</p>
            <p>истекающие: {{ urgentOffers.length }}</p>
            <p>загрузка: {{ loadingOffers }}</p>
            <p>ошибка: {{ offersError }}</p>
            <pre>{{ urgentOffers.slice(0, 2) }}</pre>
          </div> -->

          <section v-if="!user" class="cta-section my-4">
            <Card class="surface-card border-round-2xl p-4 text-center">
              <template #content>
                <i class="pi pi-user-plus text-primary text-4xl mb-3"></i>
                <h3 class="text-xl font-bold mb-2">Узнайте все доступные льготы</h3>
                <p class="text-color-secondary mb-4">
                  Войдите в систему, чтобы получить персонализированные рекомендации 
                  и не упустить важные льготы и выплаты
                </p>
                <div class="flex gap-3 justify-content-center">
                  <Button 
                    label="Войти" 
                    @click="$router.push('/login')"
                    class="p-button-primary"
                  />
                </div>
              </template>
            </Card>
          </section>

          <section v-if="urgentOffers.length > 0" class="">
            <div class="flex align-items-center gap-2 my-4">
              <i class="pi pi-exclamation-triangle text-warning"></i>
              <h3 class="text-lg font-bold m-0">Специальные предложения</h3>
              <Tag :value="urgentOffers.length" severity="warning" />
            </div>
            <div class="grid">
              <div 
                v-for="offer in urgentOffers" 
                :key="offer.id"
                class="col-12 md:col-6"
              >
                <Card class="border-warning cursor-pointer partner-offer-card" @click="openOfferModal(offer)">
                  <template #content>
                    <div class="flex align-items-start gap-3">
                      <Avatar 
                        :label="(offer.partner_name || offer.partner?.name || 'П').charAt(0).toUpperCase()" 
                        size="large" 
                        shape="circle" 
                        class="flex-shrink-0"
                        style="width: 3rem; height: 3rem;"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex align-items-center gap-2 mb-2">
                          <h4 class="text-base font-bold m-0 line-clamp-1">{{ offer.partner_name || offer.partner?.name || 'Партнер' }}</h4>
                          <Tag :value="`-${formatDiscount(offer.discount)}%`" severity="success" class="text-xs" />
                        </div>
                        <p class="text-color-secondary text-sm m-0 mb-2 line-clamp-2">{{ offer.title || 'Спецпредложение' }}</p>
                        <div class="flex align-items-center gap-2 text-xs">
                          <span class="text-color-secondary">до {{ formatValidUntil(offer.valid_until) }}</span>
                          <span class="text-warning">• осталось {{ getDaysUntilExpiry(offer.valid_until) }} дней</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </section>

          <section v-else-if="!loadingOffers && partnerOffers.length > 0" class="mb-4">
            <div class="text-center py-4 surface-card border-round">
              <i class="pi pi-gift text-4xl text-primary mb-3"></i>
              <h3 class="text-lg font-bold mb-2">Специальные предложения</h3>
              <p class="text-color-secondary">Все текущие предложения активны</p>
              <Button 
                label="Посмотреть все предложения" 
                @click="$router.push('/search')"
                class="p-button-outlined mt-2"
              />
            </div>
          </section>

          <section v-if="loadingOffers" class="mb-4">
            <div class="flex justify-content-center py-4">
              <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
              <span class="ml-2">Загрузка специальных предложений...</span>
            </div>
          </section>

          <section v-if="offersError" class="mb-4">
            <Message severity="error" :closable="false">
              {{ offersError }}
              <Button 
                @click="fetchPartnerOffers" 
                label="Попробовать снова" 
                class="p-button-outlined p-button-sm ml-3" 
              />
            </Message>
          </section>

          <section class="news-section">
            <div class="flex justify-content-between align-items-center mb-2">
              <h3 class="text-lg font-bold m-0">Последние новости</h3>
              <Button 
                label="Все" 
                class="p-button-text p-button-sm"
                @click="goToNews"
              />
            </div>
            <div v-if="loadingNews" class="flex justify-content-center py-4">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
            <div v-else-if="latestNews.length === 0" class="text-center py-4 text-color-secondary">
              <p>Новости загружаются...</p>
            </div>
            <div v-else class="grid">
              <div 
                v-for="news in latestNews" 
                :key="news.id"
                class="col-12 md:col-6"
              >
                <Card class="news-card h-full cursor-pointer" @click="openNewsModal(news)">
                  <template #content>
                    <div class="flex flex-column gap-2">
                      <div class="flex align-items-center gap-2">
                        <Tag :value="news.category || 'Новости'" class="text-xs" />
                        <span class="text-xs text-color-secondary">{{ formatDate(news.published_date || news.date) }}</span>
                      </div>
                      <h4 class="text-base font-bold m-0 line-height-2">{{ news.title }}</h4>
                      <p class="text-color-secondary text-sm m-0 line-height-2">{{ news.excerpt }}</p>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </section>

          <section class="quick-categories-section mb-2">
            <h3 class="text-lg font-bold mb-3 mt-2">Популярные категории</h3>
            <div class="grid">
              <div 
                v-for="category in quickCategories" 
                :key="category.value"
                class="col-6 md:col-4 lg:col-3"
              >
                <Card class="category-card h-full cursor-pointer" @click="goToCategory(category.value)">
                  <template #content>
                    <div class="flex flex-column align-items-center gap-2 text-center p-2">
                      <i :class="category.icon" class="text-2xl text-primary"></i>
                      <span class="text-sm font-semibold">{{ category.label }}</span>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer 
        :current-page="currentPage"
        :user="user"
        :show-profile-menu="showProfileMenu"
        @update:show-profile-menu="handleProfileMenuToggle"
        @menu-item-click="handleMenuItemClick"
      />
    </div>

    <Dialog 
      v-model:visible="showOfferModal" 
      :modal="true" 
      :style="{ width: '90vw', maxWidth: '600px' }"
      :closable="true"
      :draggable="false"
    >
      <template #header>
        <div class="flex align-items-center gap-3">
           <h2 class="font-semibold m-0 text-color-secondary line-clamp-1">{{ selectedOffer.title }}</h2>
        </div>
      </template>

      <div v-if="loadingOffer" class="flex justify-content-center py-6">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>

      <div v-else-if="selectedOffer" class="flex flex-column gap-4">
        <div class="flex align-items-center gap-2 flex-wrap">
          <Tag :value="`-${formatDiscount(selectedOffer.discount)}%`" severity="success" class="text-sm" />
          <span class="text-sm text-color-secondary" v-if="selectedOffer.valid_until">
            Действует до: {{ formatValidUntil(selectedOffer.valid_until) }}
          </span>
        </div>
        
        <div class="flex align-items-center gap-3">
          <Avatar 
            v-if="selectedOffer"
            :label="(selectedOffer.partner_name || selectedOffer.partner?.name || 'П').charAt(0).toUpperCase()" 
            size="normal" 
            shape="circle" 
            style="width: 3rem; height: 3rem; min-width: 3rem; flex-shrink: 0;"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold m-0 line-clamp-1 mb-1">{{ selectedOffer.partner_name || selectedOffer.partner?.name || 'Партнер' }}</h3>
            <div v-if="selectedOffer.partner.description" class="text-sm text-color-secondary">
              {{ selectedOffer.partner.description }}
            </div>
          </div>
        </div>
        
        <div class="text-color-secondary line-height-3">
          {{ selectedOffer.description }}
        </div>

        <div v-if="selectedOffer.partner" class="flex flex-column gap-3 surface-border">
          <div v-if="selectedOffer.partner.address" class="flex align-items-center gap-2">
            <i class="pi pi-map-marker text-primary"></i>
            <span>{{ selectedOffer.partner.address }}</span>
          </div>
          <div v-if="selectedOffer.partner.phone" class="flex align-items-center gap-2">
            <i class="pi pi-phone text-primary"></i>
            <span>{{ selectedOffer.partner.phone }}</span>
          </div>
          <div v-if="selectedOffer.partner.website" class="flex align-items-center gap-2">
            <i class="pi pi-globe text-primary"></i>
            <a :href="selectedOffer.partner.website" target="_blank" class="text-primary no-underline">
              {{ selectedOffer.partner.website }}
            </a>
          </div>
        </div>

        <div v-if="selectedOffer.target_groups && selectedOffer.target_groups.length > 0" class="surface-border">
          <p class="text-sm font-semibold m-0 mb-2">Затрагиваемые категории:</p>
          <div class="flex flex-wrap gap-2">
            <Chip 
              v-for="group in selectedOffer.target_groups" 
              :key="group"
              :label="getTargetGroupLabel(group)"
              class="text-xs"
            />
          </div>
        </div>
        <div class="flex justify-content-center">
            <Button 
              label="Открыть в 2ГИС" 
              icon="pi pi-map"
              iconPos="right"
              class="p-button-outlined p-button-primary"
              @click="open2GISRoute(selectedOffer.partner)"
            />
          </div>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showNewsModal" 
      :modal="true" 
      :style="{ width: '90vw', maxWidth: '800px' }"
      :closable="true"
      :dismissableMask="true"
    >
      <template #header>
        <div class="flex flex-column gap-2 w-full">
          <div class="flex align-items-center gap-2 flex-wrap">
            <Tag v-if="selectedNews?.category" :value="selectedNews.category" class="text-xs" />
            <span v-if="selectedNews?.published_date || selectedNews?.date" class="text-xs text-color-secondary">
              {{ formatDate(selectedNews.published_date || selectedNews.date) }}
            </span>
          </div>
          <h2 class="text-xl font-bold m-0 line-height-3">{{ selectedNews?.title || 'Новость' }}</h2>
        </div>
      </template>
      <div v-if="selectedNews" class="flex flex-column gap-4">
        <div v-if="selectedNews.image_url" class="flex justify-content-center">
          <img 
            :src="selectedNews.image_url" 
            :alt="selectedNews.title"
            class="w-full border-round-lg"
            style="max-height: 400px; object-fit: cover;"
            @error="(e) => e.target.style.display = 'none'"
          />
        </div>

        <div v-if="selectedNews.excerpt" class="text-lg text-color-secondary line-height-3">
          {{ selectedNews.excerpt }}
        </div>

        <div v-if="selectedNews.content" class="text-color line-height-3" style="white-space: pre-wrap;">
          {{ selectedNews.content }}
        </div>

        <div v-if="selectedNews.source_name || selectedNews.source_url" class="flex flex-column gap-2 pt-3 border-top-1 surface-border">
          <div class="text-sm text-color-secondary">Источник:</div>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-external-link text-primary"></i>
            <a 
              v-if="selectedNews.source_url" 
              :href="selectedNews.source_url" 
              target="_blank" 
              class="text-primary no-underline font-semibold"
            >
              {{ selectedNews.source_name || selectedNews.source_url }}
            </a>
            <span v-else class="text-color">
              {{ selectedNews.source_name }}
            </span>
          </div>
        </div>

        <div v-if="selectedNews.source_url" class="flex justify-content-end pt-2">
          <Button 
            label="Читать полностью" 
            icon="pi pi-external-link"
            iconPos="right"
            class="p-button-primary"
            @click="openNewsSource(selectedNews.source_url)"
          />
        </div>
      </div>
      <div v-else class="flex justify-content-center py-6">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>
    </Dialog>
  </div>
</template>

<script>
import api from '@/api'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VoiceAssistant from '../components/VoiceAssistant.vue'
import Footer from '../components/Footer.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Chip from 'primevue/chip'
import Message from 'primevue/message'
import Avatar from 'primevue/avatar'

export default {
  data() {
    return {
      benefits: []
    }
  },
  async mounted() {
    try {
      const response = await api.get('/benefits/')
      this.benefits = response.data
    } catch (error) {
      console.error('Ошибка загрузки льгот:', error)
    }
  }
  name: 'Home',
  components: {
    VoiceAssistant,
    Footer,
    Button,
    Card,
    Tag,
    Dialog,
    Chip,
    Message,
    Avatar
  },
  setup() {
    const router = useRouter()
    const currentPage = ref('home')
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const showProfileMenu = ref(false)
    const debugInfo = ref(true)

    const partnerOffers = ref([])
    const loadingOffers = ref(false)
    const offersError = ref(null)
    const showOfferModal = ref(false)
    const selectedOffer = ref(null)
    const loadingOffer = ref(false)

    const latestNews = ref([])
    const loadingNews = ref(false)
    const showNewsModal = ref(false)
    const selectedNews = ref(null)

    const quickCategories = [
      { label: 'Медицина', value: 'medicine', icon: 'pi pi-heart' },
      { label: 'Транспорт', value: 'transport', icon: 'pi pi-car' },
      { label: 'ЖКХ', value: 'utilities', icon: 'pi pi-home' },
      { label: 'Образование', value: 'education', icon: 'pi pi-book' },
      { label: 'Налоги', value: 'tax', icon: 'pi pi-dollar' },
      { label: 'Соцвыплаты', value: 'social_support', icon: 'pi pi-users' }
    ]

    const urgentOffers = computed(() => {
      
      if (!partnerOffers.value || !Array.isArray(partnerOffers.value)) {
        return []
      }
      
      const urgent = partnerOffers.value.filter(offer => {
        if (!offer.valid_until) {
          return false
        }
        
        const daysUntilExpiry = getDaysUntilExpiry(offer.valid_until)
        
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30
      })
    
      
      return urgent
        .sort((a, b) => getDaysUntilExpiry(a.valid_until) - getDaysUntilExpiry(b.valid_until))
        .slice(0, 5)
    })

    const getDaysUntilExpiry = (dateString) => {
      if (!dateString) {
        return Infinity
      }
      
      try {
        const expireDate = new Date(dateString)
        const today = new Date()
        
        today.setHours(0, 0, 0, 0)
        expireDate.setHours(0, 0, 0, 0)
        
        const diffTime = expireDate - today
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return days
      } catch (error) {
        return Infinity
      }
    }

    const formatValidUntil = (dateString) => {
      if (!dateString) return 'не указано'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch (error) {
        console.error('Ошибка форматирования даты:', dateString)
        return 'неверная дата'
      }
    }

    const formatDiscount = (discount) => {
      if (typeof discount === 'number') {
        return discount
      }
      if (typeof discount === 'object' && discount !== null) {
        return discount.percent || discount.value || Object.values(discount)[0] || 0
      }
      return 0
    }

    const openOfferModal = async (offer) => {
      selectedOffer.value = offer
      showOfferModal.value = true
      loadingOffer.value = true
      
      try {
        if (!offer.partner || !offer.partner.phone) {
          const { data } = await api.get(`/partner-offers/${offer.id}/`)
          selectedOffer.value = data
        }
      } catch (error) {
        console.error('Ошибка при загрузке детальной информации о предложении:', error)
      } finally {
        loadingOffer.value = false
      }
    }

    const getTargetGroupLabel = (group) => {
      const labels = {
        'pensioner': 'Пенсионеры',
        'disabled': 'Инвалиды',
        'low_income': 'Малоимущие',
        'large_family': 'Многодетные семьи',
        'veteran': 'Ветераны',
        'child': 'Дети',
        'student': 'Студенты'
      }
      return labels[group] || group
    }

    const open2GISRoute = (partner) => {
      if (!partner) return
      
      const partnerName = encodeURIComponent(partner.name)
      const city = 'yakutsk'
      
      if (partner.address) {
        const address = encodeURIComponent(`${partner.name}, ${partner.address}, Якутск`)
        const url = `https://2gis.ru/${city}/search/${address}`
        window.open(url, '_blank')
      } else {
        const url = `https://2gis.ru/${city}/search/${partnerName}`
        window.open(url, '_blank')
      }
    }

    const fetchPartnerOffers = async () => {
      loadingOffers.value = true
      offersError.value = null
      
      try {
        
        const response = await api.get('/partner-offers/latest/', {
          params: { limit: 20 }
        })
        
        
        partnerOffers.value = response.data || []
        
        if (partnerOffers.value.length > 0) {
          
          if (partnerOffers.value.length > 0 && !partnerOffers.value[0].valid_until) {
            partnerOffers.value = partnerOffers.value.map((offer, index) => ({
              ...offer,
              valid_until: new Date(Date.now() + (index + 1) * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))
          }
        }
        
      } catch (error) {
        offersError.value = 'Не удалось загрузить специальные предложения'
        
        partnerOffers.value = [
          {
            id: 1,
            title: 'Скидка 20% на все лекарства',
            description: 'Специальное предложение для пенсионеров в аптеках сети',
            partner_name: 'Аптека Здоровья',
            discount: 20,
            valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            target_groups: ['pensioner'],
            partner: {
              name: 'Аптека Здоровья',
              address: 'ул. Ленина, 123',
              phone: '+7 (4112) 123-456',
              website: 'https://apteka-zdorovie.ru'
            }
          },
          {
            id: 2,
            title: 'Бесплатный проезд для студентов',
            description: 'Акция от транспортной компании для студентов',
            partner_name: 'Городской Транспорт',
            discount: 100,
            valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            target_groups: ['student'],
            partner: {
              name: 'Городской Транспорт',
              address: 'ул. Транспортная, 45',
              phone: '+7 (4112) 234-567'
            }
          }
        ]
        
      } finally {
        loadingOffers.value = false
      }
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
      user.value = null
      showProfileMenu.value = false
      router.push('/')
    }

    const handleProfileMenuToggle = (visible) => {
      showProfileMenu.value = visible
    }

    const handleMenuItemClick = (item) => {
      if (item.action) {
        item.action()
      }
    }

    const goToCategory = (category) => {
      router.push(`/search?category=${category}`)
    }

    const goToNews = () => {
      alert('Страница новостей в разработке')
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (error) {
        return dateString
      }
    }

    const fetchNews = async () => {
      loadingNews.value = true
      try {
        const { data } = await api.get('/news/latest/', {
          params: { limit: 4 }
        })
        latestNews.value = data || []
      } catch (error) {
        console.error('Ошибка при загрузке новостей:', error)
        latestNews.value = []
      } finally {
        loadingNews.value = false
      }
    }

    const openNewsModal = (news) => {
      selectedNews.value = news
      showNewsModal.value = true
    }

    const openNewsSource = (url) => {
      if (!url) {
        console.warn('URL источника не указан')
        return
      }
      
      try {
        const urlObj = new URL(url)
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (error) {
        console.error('Ошибка при открытии источника:', error)
        let fullUrl = url
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          fullUrl = 'https://' + url
        }
        try {
          window.open(fullUrl, '_blank', 'noopener,noreferrer')
        } catch (e) {
          alert('Не удалось открыть источник новости. Проверьте URL.')
        }
      }
    }

    onMounted(() => {
      fetchPartnerOffers()
      fetchNews()
    })

    return {
      currentPage,
      user,
      showProfileMenu,
      debugInfo,
      partnerOffers,
      loadingOffers,
      offersError,
      urgentOffers,
      quickCategories,
      latestNews,
      loadingNews,
      showNewsModal,
      selectedNews,
      showOfferModal,
      selectedOffer,
      loadingOffer,
      handleProfileMenuToggle,
      handleMenuItemClick,
      logout,
      goToCategory,
      goToNews,
      formatDate,
      openNewsModal,
      openNewsSource,
      getDaysUntilExpiry,
      formatValidUntil,
      formatDiscount,
      openOfferModal,
      getTargetGroupLabel,
      open2GISRoute,
      fetchPartnerOffers,
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.partner-offer-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.partner-offer-card:hover {
  transform: translateY(-2px);
  border-color: var(--p-warning-200);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.category-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-4px);
  border-color: var(--p-primary-200);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.news-card {
  transition: transform 0.2s;
  cursor: pointer;
}

.news-card:hover {
  transform: translateY(-2px);
}
</style>