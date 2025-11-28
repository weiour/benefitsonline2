<template>
  <VoiceAssistant />
  <div class="app-layout">
    <header class="app-header">
      <div class="container mx-auto p-3">
        <div class="flex align-items-center">
          <Button 
            icon="pi pi-arrow-left" 
            @click="$router.back()"
            class="p-button-text p-button-plain"
          />
          <h1 class="text-2xl font-bold m-0 text-primary">Избранное</h1>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="container mx-auto p-4">
        <div class="mb-2">
          <div class="flex justify-content-between gap-2 surface-border pb-2">
            <Button 
              label="Государственные" 
              :class="['tab-btn text-sm w-full', activeTab === 'benefits' ? 'active' : '']"
              @click="activeTab = 'benefits'"
              :severity="activeTab === 'benefits' ? 'primary' : 'secondary'"
              text
            />
            <Button 
              label="Скидки и акции" 
              :class="['tab-btn text-sm w-full', activeTab === 'offers' ? 'active' : '']"
              @click="activeTab = 'offers'"
              :severity="activeTab === 'offers' ? 'primary' : 'secondary'"
              text
            />
          </div>
        </div>

        <div v-if="loading" class="flex justify-content-center py-6">
          <ProgressSpinner />
        </div>

        <div v-else-if="activeTab === 'benefits'">
          <div v-if="favoriteBenefits.length > 0" class="grid">
            <div 
              v-for="benefit in favoriteBenefits" 
              :key="benefit.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <Card class="h-full shadow-2 hover:shadow-4 transition-all transition-duration-300 benefit-card">
                <template #content>
                  <div class="flex justify-content-between align-items-center gap-2 pb-2">
                    <Tag 
                      :value="getTypeLabel(benefit.type)" 
                      :severity="getTypeSeverity(benefit.type)"
                      class="text-xs"
                    />
                    <Button 
                      :icon="isFavorite(benefit.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                      @click.stop="toggleFavorite(benefit)"
                      :class="['p-button-text p-button-plain', isFavorite(benefit.id) ? 'text-red-500' : 'text-color-secondary']"
                    />
                  </div>
                  
                  <div class="mb-3">
                    <h3 class="text-lg font-bold m-0 mb-2 line-clamp-2">{{ benefit.title }}</h3>
                    <p class="text-color-secondary m-0 line-clamp-3 text-sm description-text mb-4">
                      {{ benefit.short_description || benefit.description }}
                    </p>
                  </div>
                  
                  <div class="flex flex-column gap-2">
                    <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                      <i class="pi pi-users"></i>
                      <span>{{ getTargetGroupsText(benefit.target_groups) }}</span>
                    </div>
                    <div class="flex align-items-center gap-2 text-xs text-color-secondary">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ getBenefitRegionsText(benefit) }}</span>
                    </div>
                  </div>
                </template>
                
                <template #footer>
                  <div class="flex justify-content-between align-items-center p-4 pt-0">
                    <Chip 
                      :label="formatCategoryName(benefit.category)" 
                      :icon="getCategoryIcon(benefit.category)"
                      class="w-fit text-xs category-chip" 
                    />
                    <Button 
                      @click="openBenefit(benefit)" 
                      label="Подробнее" 
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      class="p-button-outlined p-button-sm text-sm action-button p-button p-button-primary" 
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <i class="pi pi-heart text-6xl text-color-secondary mb-4"></i>
            <h3 class="text-xl font-bold text-color mb-2">Нет избранных льгот</h3>
            <p class="text-color-secondary mb-4">Добавляйте понравившиеся льготы в избранное</p>
            <Button 
              label="Найти льготы" 
              @click="$router.push('/search')"
              class="p-button-primary"
            />
          </div>
        </div>

        <div v-else-if="activeTab === 'offers'">
          <div v-if="favoriteOffers.length > 0" class="grid">
            <div 
              v-for="offer in favoriteOffers" 
              :key="offer.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <Card class="partner-offer-card h-full cursor-pointer shadow-2" @click="openOfferModal(offer)">
                <template #content>
                  <div class="flex flex-column gap-3">
                    <div class="flex align-items-center gap-3">
                      <Avatar 
                        :label="(offer.partner_name || offer.partner?.name || 'П').charAt(0).toUpperCase()" 
                        size="large" 
                        shape="circle" 
                        class="fixed-avatar"
                        style="width: 3rem; height: 3rem; min-width: 3rem;"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="text-base font-bold m-0 line-clamp-1">{{ offer.partner_name || offer.partner?.name || 'Партнер' }}</h4>
                        <span class="text-xs text-color-secondary line-clamp-1">{{ getPartnerTypeText(offer.partner_type) }}</span>
                      </div>
                      <Button 
                        :icon="isFavorite(offer.id, 'offer') ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                        @click.stop="toggleFavorite(offer, 'offer')"
                        :class="['p-button-text p-button-plain', isFavorite(offer.id, 'offer') ? 'text-red-500' : 'text-color-secondary']"
                      />
                    </div>
                    
                    <div>
                      <h3 class="text-lg font-bold m-0 mb-2 line-clamp-2 offer-title">
                        {{ offer.title || 'Специальное предложение' }}
                      </h3>
                      <p class="text-sm m-0 line-clamp-2 flex-1 text-color-secondary offer-description">
                        {{ offer.description }}
                      </p>
                    </div>

                    <div class="flex align-items-center flex-wrap gap-2">
                      <Tag :value="`-${formatDiscount(offer.discount)}%`" severity="success" class="text-xs font-bold" />
                      <span class="text-xs text-color-secondary" v-if="offer.valid_until">
                        до {{ formatValidUntil(offer.valid_until) }}
                      </span>
                    </div>
                    
                    <div v-if="offer.target_groups && offer.target_groups.length > 0" class="flex flex-wrap gap-1">
                      <Chip 
                        v-for="group in offer.target_groups.slice(0, 2)" 
                        :key="group"
                        :label="getTargetGroupLabel(group)"
                        class="text-xs"
                      />
                      <span v-if="offer.target_groups.length > 2" class="text-xs text-color-secondary">
                        +{{ offer.target_groups.length - 2 }}
                      </span>
                    </div>
                  </div>
                </template>
                
                <template #footer>
                  <div class="flex justify-content-end align-items-center p-4 pt-0">
                    <Button 
                      @click.stop="openOfferModal(offer)" 
                      label="Подробнее" 
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      class="p-button-outlined p-button-sm text-sm action-button p-button p-button-primary" 
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <i class="pi pi-heart text-6xl text-color-secondary mb-4"></i>
            <h3 class="text-xl font-bold text-color mb-2">Нет избранных предложений</h3>
            <p class="text-color-secondary mb-4">Добавляйте интересные акции в избранное</p>
            <Button 
              label="Найти предложения" 
              @click="$router.push('/search')"
              class="p-button-primary"
            />
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

      <div v-if="selectedBenefit" class="relative">
        <Card 
          :class="['shadow-3 overflow-hidden border-none', 
                  { 'sponsored-benefit': selectedBenefit?.is_sponsored }]"
        >
          <template #header>
            <div class="surface-border z-5 p-3 shadow-1">
              <div class="flex justify-content-between align-items-center">
                <h2 class="text-xl font-bold m-0 ml-1">Информация о льготе</h2>
                <Button 
                  icon="pi pi-times" 
                  @click="closeBenefitModal"
                  class="p-button-text p-button-plain border-circle"
                  style="width: 2.5rem; height: 2.5rem;"
                />
              </div>
            </div>
            <div class="flex flex-column gap-3 p-4 pb-0 pt-4">
              <div class="flex justify-content-between align-items-center w-full">
                <div class="flex align-items-center gap-2">
                  <Tag 
                    :value="getTypeLabel(selectedBenefit?.type)" 
                    :severity="getTypeSeverity(selectedBenefit?.type)"
                    class="text-xs"
                  />
                  <Chip
                    v-if="selectedBenefit.category"
                    :label="selectedBenefit.category.title"
                    class="text-xs"
                  />
                </div>
                <Button 
                  :icon="isFavorite(selectedBenefit.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                  @click="toggleFavorite(selectedBenefit)"
                  :class="['p-button-text p-button-plain border-circle', isFavorite(selectedBenefit.id) ? 'text-red-500' : 'text-color-secondary']"
                  style="width: 2.5rem; height: 2.5rem;"
                  v-tooltip.top="isFavorite(selectedBenefit.id) ? 'Убрать из избранного' : 'Добавить в избранное'"
                />
              </div>
              <h1 class="m-0 text-2xl font-bold line-height-3">{{ selectedBenefit.title }}</h1>
              <p class="m-0 text-color-secondary">
                {{ selectedBenefit.description }}
              </p>
            </div>
          </template>

          <template #content>
            <div class="px-2 pt-0 flex flex-column gap-2 mb-2">
              <section>
                <h3 class="text-lg font-bold mb-2 mt-0">Кому доступна льгота</h3>
                <p class="text-color-secondary m-0 line-height-3">
                  {{ getTargetGroupsText(selectedBenefit.target_groups) }}
                </p>
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

              <section v-if="selectedBenefitRequestMessage || selectedBenefitRequestError">
                <Message
                  v-if="selectedBenefitRequestMessage"
                  severity="success"
                  :closable="false"
                >
                  {{ selectedBenefitRequestMessage }}
                </Message>
                <Message
                  v-else-if="selectedBenefitRequestError"
                  severity="error"
                  :closable="false"
                >
                  {{ selectedBenefitRequestError }}
                </Message>
              </section>
            </div>
            <div class="p-4 flex flex-column gap-2">
              <Button
                :label="selectedBenefitHasRequest ? 'Заявка отправлена' : 'Оставить заявку'"
                :disabled="selectedBenefitHasRequest"
                :loading="selectedBenefitRequesting"
                icon="pi pi-send"
                class="p-button-lg w-full p-button-primary"
                @click="requestSelectedBenefit"
              />
              <Button
                label="Оформить через МФЦ"
                icon="pi pi-building"
                class="p-button-lg w-full p-button-outlined"
                @click="openMfc"
              />
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showOfferModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="offer-details-modal"
      :style="{ width: '95vw', maxWidth: '500px', background: 'transparent', boxShadow: 'none' }"
      :showHeader="false"
      :contentStyle="{ padding: '0', margin: '0', background: 'transparent', border: 'none', boxShadow: 'none' }"
      :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }"
    >
      <template #closeicon>
        <i class="pi pi-times"></i>
      </template>

      <div v-if="loadingOffer" class="flex justify-content-center py-6">
        <ProgressSpinner />
      </div>

      <div v-else-if="selectedOffer" class="relative">
        <Card class="shadow-3 overflow-hidden border-none offer-modal-card">
          <template #header>
            <div class="surface-border z-5 p-3 shadow-1">
              <div class="flex justify-content-between align-items-center">
                <h2 class="text-xl font-bold m-0 ml-1">Специальное предложение</h2>
                <Button 
                  icon="pi pi-times" 
                  @click="showOfferModal = false"
                  class="p-button-text p-button-plain border-circle"
                  style="width: 2.5rem; height: 2.5rem;"
                />
              </div>
            </div>
            
            <div class="flex flex-column gap-3 p-4 pb-0 pt-4">
              <div class="flex justify-content-between align-items-start gap-3">
                <div class="flex-1">
                  <div class="flex justify-content-between">
                    <h1 class="m-0 text-2xl font-bold line-height-3">{{ selectedOffer.title || 'Специальное предложение' }}</h1>
                    <Button 
                      :icon="isFavorite(selectedOffer.id, 'offer') ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                      @click="toggleFavorite(selectedOffer, 'offer')"
                      :class="['p-button-text p-button-plain border-circle', isFavorite(selectedOffer.id, 'offer') ? 'text-red-500' : 'text-color-secondary']"
                      style="width: 2.5rem; height: 2.5rem;"
                      v-tooltip.top="isFavorite(selectedOffer.id, 'offer') ? 'Убрать из избранного' : 'Добавить в избранное'"
                    />
                  </div>
                  <div class="flex align-items-center gap-2 mt-2">
                    <Tag :value="`-${formatDiscount(selectedOffer.discount)}%`" severity="success" class="text-sm font-bold" />
                    <span class="text-sm text-color-secondary" v-if="selectedOffer.valid_until">
                      до {{ formatValidUntil(selectedOffer.valid_until) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex align-items-center gap-3 surface-100 border-round-2xl p-3">
                <Avatar 
                  :label="(selectedOffer.partner_name || selectedOffer.partner?.name || 'П').charAt(0).toUpperCase()" 
                  size="large" 
                  shape="circle" 
                  class="flex-shrink-0"
                  style="width: 3.5rem; height: 3.5rem; font-size: 1.2rem;"
                />
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold m-0 line-clamp-1 mb-1">{{ selectedOffer.partner_name || selectedOffer.partner?.name || 'Партнер' }}</h3>
                  <div v-if="selectedOffer.partner?.description" class="text-sm text-color-secondary line-clamp-2">
                    {{ selectedOffer.partner.description }}
                  </div>
                </div>
              </div>

              <div>
                <p class="m-0 text-color-secondary line-height-3 text-sm">
                  {{ selectedOffer.description }}
                </p>
              </div>
            </div>
          </template>

          <template #content>
            <div class="pt-0 flex flex-column gap-2 mb-2">
              <section v-if="selectedOffer.partner && (selectedOffer.partner.address || selectedOffer.partner.phone || selectedOffer.partner.website)">
                <h3 class="text-lg font-bold mb-3 mt-0">Контактная информация</h3>
                <div class="flex flex-column gap-3 border-round-2xl">
                  <div v-if="selectedOffer.partner.address" class="flex align-items-start gap-2">
                    <i class="pi pi-map-marker text-primary mt-1"></i>
                    <div>
                      <strong class="text-sm">Адрес:</strong>
                      <p class="m-0 text-sm text-color-secondary">{{ selectedOffer.partner.address }}</p>
                    </div>
                  </div>
                  <div v-if="selectedOffer.partner.phone" class="flex align-items-center gap-2">
                    <i class="pi pi-phone text-primary"></i>
                    <div class="flex">
                      <strong class="text-sm">Телефон: </strong>
                      <p class="m-0 text-sm text-color-secondary">{{ selectedOffer.partner.phone }}</p>
                    </div>
                  </div>
                  <div v-if="selectedOffer.partner.website" class="flex align-items-center gap-2">
                    <i class="pi pi-globe text-primary"></i>
                    <div>
                      <strong class="text-sm">Сайт: </strong>
                      <a :href="selectedOffer.partner.website" target="_blank" class="text-primary no-underline text-sm">
                        {{ selectedOffer.partner.website }}
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </template>

          <template #footer>
            <div class="px-4 pb-4 flex flex-column gap-2">
              <Button
                label="Открыть в 2ГИС"
                icon="pi pi-map"
                class="p-button-lg w-full p-button-primary"
                @click="open2GISRoute(selectedOffer.partner)"
              />
              <Button
                v-if="selectedOffer.partner?.website"
                label="Перейти на сайт"
                icon="pi pi-external-link"
                class="p-button-lg w-full p-button-outlined"
                @click="window.open(selectedOffer.partner.website, '_blank')"
              />
            </div>
          </template>
        </Card>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showSnilsModal" 
      :modal="true" 
      :closable="true"
      :dismissableMask="true"
      class="snils-modal"
      :style="{ width: '90vw', maxWidth: '400px' }"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center w-full">
          <h3 class="text-lg font-bold m-0">Укажите СНИЛС</h3>
          <Button 
            icon="pi pi-times" 
            @click="showSnilsModal = false"
            class="p-button-text p-button-plain border-circle"
            style="width: 2.5rem; height: 2.5rem;"
          />
        </div>
      </template>

      <div class="flex flex-column gap-4">
        <Message
          severity="info"
          :closable="false"
          class="text-sm"
        >
          Для подачи заявки на льготу необходимо указать СНИЛС
        </Message>

        <div class="flex flex-column gap-2">
          <label for="snils-input" class="font-semibold">СНИЛС</label>
          <InputText
            id="snils-input"
            v-model="snilsInput"
            placeholder="000-000-000 00"
            :class="{ 'p-invalid': snilsError }"
            @input="formatSnilsInput"
            maxlength="14"
            class="w-full"
            autocomplete="off"
          />
          <small v-if="snilsError" class="p-error">{{ snilsError }}</small>
          <small v-else class="text-color-secondary">Введите 11 цифр СНИЛС</small>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button 
            label="Отмена" 
            @click="showSnilsModal = false"
            class="p-button-outlined"
            severity="secondary"
          />
          <Button 
            label="Сохранить и отправить заявку" 
            @click="saveSnils"
            :loading="savingSnils"
            class="p-button-primary"
            icon="pi pi-check"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePageSetup } from '../utils/scripts.js'
import VoiceAssistant from '../components/VoiceAssistant.vue'
import Footer from '../components/Footer.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import api from '../services/api'

export default {
  name: 'Favorites',
  components: {
    VoiceAssistant,
    Footer,
    Button,
    Card,
    Tag,
    Chip,
    Avatar,
    Dialog,
    ProgressSpinner,
    Message,
    InputText
  },
  setup() {
    const router = useRouter()
    const page = usePageSetup('favorites')
    const activeTab = ref('benefits')
    const favorites = ref({ benefits: [], offers: [] })
    const allBenefits = ref([])
    const allOffers = ref([])
    const loading = ref(false)
    const showBenefitModal = ref(false)
    const selectedBenefit = ref(null)
    const selectedBenefitHasRequest = ref(false)
    const selectedBenefitRequesting = ref(false)
    const selectedBenefitRequestMessage = ref('')
    const selectedBenefitRequestError = ref('')
    const showSnilsModal = ref(false)
    const snilsInput = ref('')
    const snilsError = ref('')
    const savingSnils = ref(false)
    const showOfferModal = ref(false)
    const selectedOffer = ref(null)
    const loadingOffer = ref(false)

    const loadFavorites = () => {
      try {
        const saved = localStorage.getItem('userFavorites')
        if (saved) {
          favorites.value = JSON.parse(saved)
        } else {
          favorites.value = { benefits: [], offers: [] }
        }
      } catch (e) {
        console.error('Ошибка загрузки избранного:', e)
        favorites.value = { benefits: [], offers: [] }
      }
    }

    const saveFavorites = () => {
      try {
        localStorage.setItem('userFavorites', JSON.stringify(favorites.value))
      } catch (e) {
        console.error('Ошибка сохранения избранного:', e)
      }
    }

    const fetchBenefits = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const response = await api.get('/benefits/', config)
        allBenefits.value = response.data || []
      } catch (e) {
        console.error('Ошибка загрузки льгот:', e)
        allBenefits.value = []
      }
    }

    const fetchOffers = async () => {
      try {
        const { data } = await api.get('/partner-offers/latest/', {
          params: { limit: 100 }
        })
        allOffers.value = data || []
      } catch (e) {
        console.error('Ошибка загрузки предложений:', e)
        allOffers.value = []
      }
    }

    const loadData = async () => {
      loading.value = true
      try {
        await Promise.all([fetchBenefits(), fetchOffers()])
      } finally {
        loading.value = false
      }
    }

    const favoriteBenefits = computed(() => {
      if (!favorites.value.benefits || favorites.value.benefits.length === 0) {
        return []
      }
      return allBenefits.value.filter(benefit => 
        favorites.value.benefits.includes(benefit.id)
      )
    })

    const favoriteOffers = computed(() => {
      if (!favorites.value.offers || favorites.value.offers.length === 0) {
        return []
      }
      return allOffers.value.filter(offer => 
        favorites.value.offers.includes(offer.id)
      )
    })

    const isFavorite = (id, type = 'benefit') => {
      const key = type === 'offer' ? 'offers' : 'benefits'
      return favorites.value[key]?.includes(id) || false
    }

    const toggleFavorite = (item, type = 'benefit') => {
      const key = type === 'offer' ? 'offers' : 'benefits'
      if (!favorites.value[key]) {
        favorites.value[key] = []
      }
      const index = favorites.value[key].indexOf(item.id)
      
      if (index > -1) {
        favorites.value[key].splice(index, 1)
      } else {
        favorites.value[key].push(item.id)
      }
      
      saveFavorites()
    }

    const getTypeLabel = (type) => {
      const typeMap = {
        federal: 'Федеральная',
        regional: 'Региональная', 
        municipal: 'Муниципальная',
        commercial: 'Спецпредложение'
      }
      return typeMap[type] || type
    }

    const getTypeSeverity = (type) => {
      const severityMap = {
        federal: 'info',
        regional: 'success',
        municipal: 'warning',
        commercial: 'help'
      }
      return severityMap[type] || 'secondary'
    }

    const formatCategoryName = (category) => {
      if (!category) return 'Не указано'
      return category.title || category.key || 'Не указано'
    }

    const getCategoryIcon = (category) => {
      if (!category) return 'pi pi-tag'
      const iconMap = {
        'transport': 'pi pi-car',
        'medicine': 'pi pi-heart',
        'utilities': 'pi pi-home',
        'education': 'pi pi-book',
        'culture': 'pi pi-ticket',
        'tax': 'pi pi-dollar'
      }
      return iconMap[category.key] || 'pi pi-tag'
    }

    const getTargetGroupsText = (groups) => {
      if (!groups || !Array.isArray(groups)) return '—'
      const labels = {
        'pensioner': 'Пенсионеры',
        'disabled': 'Инвалиды',
        'veteran': 'Ветераны',
        'family': 'Многодетные семьи',
        'student': 'Студенты',
        'low_income': 'Малоимущие',
        'child': 'Дети'
      }
      return groups.map(g => {
        const groupObj = typeof g === 'object' ? g : { key: g }
        return labels[groupObj.key] || groupObj.title || groupObj.key || g
      }).join(', ') || '—'
    }

    const getBenefitRegionsText = (benefit) => {
      if (!benefit?.regions || benefit.regions.length === 0) return 'По всей России'
      
      const regions = benefit.regions
      if (regions.includes('all') || regions.includes('ALL')) {
        return 'По всей России'
      }
      
      if (regions.length === 1) return regions[0]
      if (regions.length <= 3) return regions.join(', ')
      return `${regions[0]} и еще ${regions.length - 1} регионов`
    }

    const getSelectedBenefitRegionsText = computed(() => {
      if (!selectedBenefit.value?.regions) return 'По всей России'
      const regions = selectedBenefit.value.regions
      if (regions.includes('all') || regions.includes('ALL')) {
        return 'По всей России'
      }
      return regions.join(', ') || 'По всей России'
    })

    const formatDiscount = (discount) => {
      if (typeof discount === 'number') {
        return discount
      }
      if (typeof discount === 'object' && discount !== null) {
        return discount.percent || discount.value || Object.values(discount)[0] || 0
      }
      return 0
    }

    const formatValidUntil = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
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

    const getPartnerTypeText = (type) => {
      const types = {
        'retail': 'Розничная торговля',
        'services': 'Услуги',
        'cafe': 'Кафе и рестораны',
        'health': 'Здоровье и красота',
        'education': 'Образование'
      }
      return types[type] || type || 'Партнер'
    }

    const openBenefit = (benefit) => {
      selectedBenefit.value = benefit
      selectedBenefitHasRequest.value = false
      selectedBenefitRequestMessage.value = ''
      selectedBenefitRequestError.value = ''
      showSnilsModal.value = false
      snilsInput.value = ''
      snilsError.value = ''
      showBenefitModal.value = true
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

    const formatSnilsInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
      
      let formatted = ''
      if (value.length > 0) {
        formatted = value.slice(0, 3)
        if (value.length > 3) {
          formatted += '-' + value.slice(3, 6)
        }
        if (value.length > 6) {
          formatted += '-' + value.slice(6, 9)
        }
        if (value.length > 9) {
          formatted += ' ' + value.slice(9, 11)
        }
      }
      
      snilsInput.value = formatted
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

    const openGosuslugi = () => {
      if (selectedBenefit.value) {
        const searchQuery = encodeURIComponent(selectedBenefit.value.title || 'льгота')
        const url = `https://www.gosuslugi.ru/10052/1/form?query=${searchQuery}`
        window.open(url, '_blank')
      }
    }

    const openMfc = () => {
      window.open('https://mfc.ru/', '_blank')
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

    watch(() => favorites.value, () => {
      saveFavorites()
    }, { deep: true })

    onMounted(() => {
      loadFavorites()
      loadData()
    })

    return {
      ...page,
      activeTab,
      favoriteBenefits,
      favoriteOffers,
      loading,
      showBenefitModal,
      selectedBenefit,
      selectedBenefitHasRequest,
      selectedBenefitRequesting,
      selectedBenefitRequestMessage,
      selectedBenefitRequestError,
      showSnilsModal,
      snilsInput,
      snilsError,
      savingSnils,
      saveSnils,
      formatSnilsInput,
      showOfferModal,
      selectedOffer,
      loadingOffer,
      isFavorite,
      toggleFavorite,
      getTypeLabel,
      getTypeSeverity,
      formatCategoryName,
      getCategoryIcon,
      getTargetGroupsText,
      getBenefitRegionsText,
      getSelectedBenefitRegionsText,
      formatDiscount,
      formatValidUntil,
      getTargetGroupLabel,
      getPartnerTypeText,
      openBenefit,
      closeBenefitModal,
      requestSelectedBenefit,
      openOfferModal,
      openGosuslugi,
      openMfc,
      open2GISRoute,
      handleToggleProfileMenu,
      handleMenuItemClick,
      handleGoToHome,
      handleStartVoiceSearch
    }
  }
}
</script>

<style scoped>
.benefit-card {
  transition: transform 0.2s;
  cursor: pointer;
}

.benefit-card:hover {
  transform: translateY(-2px);
}

.partner-offer-card {
  transition: transform 0.2s;
}

.partner-offer-card:hover {
  transform: translateY(-2px);
}
</style>
